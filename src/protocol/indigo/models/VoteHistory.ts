export type VoteHistory = {
    slot: number;
    output_hash: string;
    owner: string;
    poll_id: bigint;
    poll_end_time: bigint;
    vote_amount: bigint;
    vote_option: string;
};
