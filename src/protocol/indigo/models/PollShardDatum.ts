export type PollShardDatum = {
    poll_id: bigint;
    yes_votes: bigint;
    no_votes: bigint;
    end_time: bigint;
    manager_address: string;
};