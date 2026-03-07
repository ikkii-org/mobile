import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountIdempotentInstruction,
    createSyncNativeInstruction,
    createCloseAccountInstruction,
} from "@solana/spl-token";
import { Buffer } from "buffer";

export const PROGRAM_ID = new PublicKey("7rP4rHKBqnYGB2UgpeRtd9f3FZ1PHwfc4iPVhWRv9UP4");

/** The native SOL mint address (wrapped SOL) */
export const WSOL_MINT = NATIVE_MINT; // So11111111111111111111111111111111111111112

export function isNativeSol(tokenMint: PublicKey): boolean {
    return tokenMint.equals(NATIVE_MINT);
}

/**
 * Helper to convert UUID string to a 16-byte array for Anchor args
 */
function uuidToUint8Array(uuidStr: string): Uint8Array {
    const hexStr = uuidStr.replace(/-/g, "");
    if (hexStr.length !== 32) throw new Error("Invalid UUID length");
    const arr = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        arr[i] = parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
    }
    return arr;
}

// Helper to write i64/u64 to Uint8Array safely without node Buffer
function writeBigInt64LE(arr: Uint8Array, value: bigint, offset: number) {
    let unshifted = BigInt.asUintN(64, value);
    for (let i = 0; i < 8; i++) {
        arr[offset + i] = Number(unshifted & 0xffn);
        unshifted >>= 8n;
    }
}

/**
 * Anchor 8-byte discriminators for instructions (from IDL)
 */
const INSTRUCTION_DISCRIMINATORS = {
    createEscrow: new Uint8Array([253, 215, 165, 116, 36, 108, 68, 80]),
    joinEscrow: new Uint8Array([205, 250, 117, 19, 126, 211, 205, 103]),
    cancelEscrow: new Uint8Array([156, 203, 54, 179, 38, 72, 33, 21]),
};

// String to Uint8Array helper
function stringToUint8Array(str: string): Uint8Array {
    return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
}

/**
 * Build the wrap-SOL instruction set: create wSOL ATA (idempotent) + fund it + sync.
 * These must be prepended to the escrow instruction when tokenMint == NATIVE_MINT.
 */
export function buildWrapSolInstructions(
    playerPubKey: PublicKey,
    lamports: number
): TransactionInstruction[] {
    const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, playerPubKey, false);
    return [
        // Create the wSOL ATA if it doesn't already exist (idempotent — safe to always include)
        createAssociatedTokenAccountIdempotentInstruction(
            playerPubKey,  // payer
            wsolAta,       // ATA address
            playerPubKey,  // owner
            NATIVE_MINT,
        ),
        // Transfer raw SOL lamports into the wSOL ATA
        SystemProgram.transfer({
            fromPubkey: playerPubKey,
            toPubkey: wsolAta,
            lamports,
        }),
        // Sync so the SPL token balance reflects the new lamport balance
        createSyncNativeInstruction(wsolAta),
    ];
}

/**
 * Build close-wSOL-ATA instruction to unwrap wSOL back to native SOL.
 * Must be appended after cancel/settle refund when tokenMint == NATIVE_MINT.
 * The ATA's entire lamport balance (stake + rent) is sent to `destinationPubKey`.
 */
export function buildUnwrapSolInstruction(
    wsolAtaOwner: PublicKey,
    destinationPubKey: PublicKey
): TransactionInstruction {
    const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, wsolAtaOwner, false);
    return createCloseAccountInstruction(
        wsolAta,            // token account to close
        destinationPubKey,  // lamports destination (the player's wallet)
        wsolAtaOwner,       // authority (owner of the ATA)
    );
}

/**
 * Create Escrow Instruction Builder.
 *
 * For native SOL: returns wrap instructions + the escrow instruction.
 * For SPL tokens: returns just the escrow instruction.
 */
export function buildCreateEscrowInstructions(
    duelId: string,
    stakeAmount: number,
    expiryMs: number,
    tokenMint: PublicKey,
    player1PubKey: PublicKey
): TransactionInstruction[] {
    const duelIdArr = uuidToUint8Array(duelId);

    // Get PDAs
    const [escrowPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("escrow"), duelIdArr],
        PROGRAM_ID
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("vault"), duelIdArr],
        PROGRAM_ID
    );

    // For native SOL, player's token account is their wSOL ATA
    const player1TokenAccount = getAssociatedTokenAddressSync(tokenMint, player1PubKey, false);

    // Serialize args
    // Layout: discriminator(8) + duelId(16) + stakeAmount(8) + expiry(8)
    const data = new Uint8Array(8 + 16 + 8 + 8);
    data.set(INSTRUCTION_DISCRIMINATORS.createEscrow, 0);
    data.set(duelIdArr, 8);
    writeBigInt64LE(data, BigInt(stakeAmount), 24);
    const expirySec = Math.floor((Date.now() + expiryMs) / 1000);
    writeBigInt64LE(data, BigInt(expirySec), 32);

    const escrowIx = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
            { pubkey: player1PubKey, isSigner: true, isWritable: true },
            { pubkey: escrowPda, isSigner: false, isWritable: true },
            { pubkey: tokenMint, isSigner: false, isWritable: false },
            { pubkey: player1TokenAccount, isSigner: false, isWritable: true },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(data),
    });

    if (isNativeSol(tokenMint)) {
        // Prepend: create wSOL ATA + fund it with lamports + sync balance
        return [...buildWrapSolInstructions(player1PubKey, stakeAmount), escrowIx];
    }

    return [escrowIx];
}

/**
 * Join Escrow Instruction Builder.
 *
 * For native SOL: returns wrap instructions + the join instruction.
 * For SPL tokens: returns just the join instruction.
 *
 * stakeAmountLamports is only needed for the SOL wrap path.
 */
export function buildJoinEscrowInstructions(
    duelId: string,
    tokenMint: PublicKey,
    player2PubKey: PublicKey,
    stakeAmountLamports?: number
): TransactionInstruction[] {
    const duelIdArr = uuidToUint8Array(duelId);

    const [escrowPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("escrow"), duelIdArr],
        PROGRAM_ID
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("vault"), duelIdArr],
        PROGRAM_ID
    );

    const player2TokenAccount = getAssociatedTokenAddressSync(tokenMint, player2PubKey, false);

    const data = new Uint8Array(8);
    data.set(INSTRUCTION_DISCRIMINATORS.joinEscrow, 0);

    const joinIx = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
            { pubkey: player2PubKey, isSigner: true, isWritable: true },
            { pubkey: escrowPda, isSigner: false, isWritable: true },
            { pubkey: player2TokenAccount, isSigner: false, isWritable: true },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(data),
    });

    if (isNativeSol(tokenMint)) {
        if (!stakeAmountLamports) throw new Error("stakeAmountLamports required for SOL duels");
        return [...buildWrapSolInstructions(player2PubKey, stakeAmountLamports), joinIx];
    }

    return [joinIx];
}

/**
 * Cancel Escrow Instruction Builder.
 *
 * For native SOL: returns the cancel instruction + an unwrap instruction to
 * convert the refunded wSOL back to native SOL.
 * For SPL tokens: returns just the cancel instruction.
 */
export function buildCancelEscrowInstructions(
    duelId: string,
    tokenMint: PublicKey,
    player1PubKey: PublicKey
): TransactionInstruction[] {
    const duelIdArr = uuidToUint8Array(duelId);

    const [escrowPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("escrow"), duelIdArr],
        PROGRAM_ID
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("vault"), duelIdArr],
        PROGRAM_ID
    );

    const player1TokenAccount = getAssociatedTokenAddressSync(tokenMint, player1PubKey, false);

    const data = new Uint8Array(8);
    data.set(INSTRUCTION_DISCRIMINATORS.cancelEscrow, 0);

    const cancelIx = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
            { pubkey: player1PubKey, isSigner: true, isWritable: true },
            { pubkey: escrowPda, isSigner: false, isWritable: true },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: player1TokenAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(data),
    });

    if (isNativeSol(tokenMint)) {
        // The wSOL ATA may not exist at cancel time (it was created transiently during
        // create_escrow and may have been closed). We must ensure it exists so the
        // on-chain program can transfer the refunded stake into it.
        const ensureAtaIx = createAssociatedTokenAccountIdempotentInstruction(
            player1PubKey,        // payer
            player1TokenAccount,  // ATA address (wSOL)
            player1PubKey,        // owner
            NATIVE_MINT,
        );
        // Sequence: ensure ATA exists → cancel (refunds into ATA) → unwrap (closes ATA → native SOL)
        return [ensureAtaIx, cancelIx, buildUnwrapSolInstruction(player1PubKey, player1PubKey)];
    }

    return [cancelIx];
}

// ─── Legacy single-instruction exports (kept for compatibility) ───────────────

/** @deprecated Use buildCreateEscrowInstructions instead */
export function buildCreateEscrowInstruction(
    duelId: string,
    stakeAmount: number,
    expiryMs: number,
    tokenMint: PublicKey,
    player1PubKey: PublicKey
) {
    const ixs = buildCreateEscrowInstructions(duelId, stakeAmount, expiryMs, tokenMint, player1PubKey);
    return ixs[ixs.length - 1]; // last ix is always the escrow ix
}

/** @deprecated Use buildJoinEscrowInstructions instead */
export function buildJoinEscrowInstruction(
    duelId: string,
    tokenMint: PublicKey,
    player2PubKey: PublicKey
) {
    const ixs = buildJoinEscrowInstructions(duelId, tokenMint, player2PubKey);
    return ixs[ixs.length - 1];
}

/** @deprecated Use buildCancelEscrowInstructions instead */
export function buildCancelEscrowInstruction(
    duelId: string,
    tokenMint: PublicKey,
    player1PubKey: PublicKey
) {
    const ixs = buildCancelEscrowInstructions(duelId, tokenMint, player1PubKey);
    return ixs[0]; // first ix is always the cancel ix
}
