import { bech32 } from "bech32";
import { toAddress } from "../helpers";

export interface SystemParamsV2 {
    cdpCreatorParams: CdpCreatorParams;
    cdpParams: CdpParams;
    collectorParams: CollectorParams;
    distributionParams: DistributionParams;
    executeParams: ExecuteParams;
    govParams: GovParams;
    indyToken: AssetClass;
    pollManagerParams: PollManagerParams;
    pollShardParams: PollShardParams;
    scriptReferences: ScriptReferences;
    stabilityPoolParams: StabilityPoolParams;
    stakingParams: StakingParams;
    startTime: StartTime;
    treasuryParams: TreasuryParams;
    versionRecordParams: VersionRecordParams;
    validatorHashes: ValidatorHashes;
}

export interface ValidatorHashes {
    cdpCreatorHash: string;
    cdpHash: string;
    collectorHash: string;
    executeHash: string;
    govHash: string;
    pollManagerHash: string;
    pollShardHash: string;
    stabilityPoolHash: string;
    stakingHash: string;
    treasuryHash: string;
    versionRegistryHash: string;
}

export interface StartTime {
    blockHeader: string;
    slot: number;
}
export interface CdpCreatorParams {
    cdpAssetCs: CurrencySymbol;
    cdpAuthTk?: AssetClass;
    cdpCreatorNft: AssetClass;
    cdpScriptHash: string;
    iAssetAuthTk?: AssetClass;
    versionRecordToken: AssetClass;
}
export interface CurrencySymbol {
    unCurrencySymbol: string;
}
export type AssetClass = [CurrencySymbol, TokenName];
export interface CdpParams {
    cdpAssetSymbol: CurrencySymbol;
    cdpAuthToken: AssetClass;
    collectorValHash: string;
    govNFT: AssetClass;
    iAssetAuthToken: AssetClass;
    spValHash: string;
    stabilityPoolAuthToken: AssetClass;
    upgradeToken: AssetClass;
    versionRecordToken: AssetClass;
}
export interface CollectorParams {
    stakingManagerNFT: AssetClass;
    stakingToken: AssetClass;
    versionRecordToken: AssetClass;
}
export interface DistributionParams {
    distributionSchedule: DistributionSchedule;
    initialIndyDistribution: number;
    totalINDYSupply: number;
    treasuryIndyAmount: number;
}
export interface DistributionSchedule {
    z_ipd: number;
    z_lpd: number;
    z_spd: number;
    z_tv: number;
    λM_ipd?: OnChainDecimal[] | null;
    λM_lpd?: OnChainDecimal[] | null;
    λM_spd?: OnChainDecimal[] | null;
    λM_tv: OnChainDecimal;
}
export interface OnChainDecimal {
    getOnChainInt: number;
}
export interface ExecuteParams {
    cdpValHash: string;
    govNFT?: AssetClass;
    iAssetToken?: AssetClass;
    sPoolValHash: string;
    stabilityPoolToken?: AssetClass;
    upgradeToken?: AssetClass;
    versionRecordToken?: AssetClass;
    versionRegistryValHash: string;
}
export interface GovParams {
    gBiasTime: number;
    govNFT: AssetClass;
    indyAsset?: AssetClass;
    pollManagerValHash: string;
    pollToken?: AssetClass;
    upgradeToken?: AssetClass;
    versionRecordToken?: AssetClass;
}
export interface PollManagerParams {
    distributionSchedule: DistributionSchedule;
    govExecuteValHash: string;
    govNFT?: AssetClass;
    indyAsset?: AssetClass;
    initialIndyDistribution: number;
    pBiasTime: number;
    pollToken: AssetClass;
    shardsValHash: string;
    stakingToken?: AssetClass;
    stakingValHash: string;
    totalINDYSupply: number;
    treasuryValHash: string;
    upgradeToken?: AssetClass;
}
export interface PollShardParams {
    indyAsset?: AssetClass;
    pollToken?: AssetClass;
    stakingToken?: AssetClass;
    stakingValHash: string;
}
export interface ScriptReferences {
    authTokenPolicies: AuthTokenPolicies;
    cdpCreatorValidatorRef: CdpCreatorValidatorRef;
    cdpValidatorRef: CdpValidatorRef;
    collectorValidatorRef: CollectorValidatorRef;
    executeValidatorRef: ExecuteValidatorRef;
    governanceValidatorRef: GovernanceValidatorRef;
    iAssetTokenPolicyRef: IAssetTokenPolicyRef;
    liquidityValidatorRef: LiquidityValidatorRef;
    pollManagerValidatorRef: PollManagerValidatorRef;
    pollShardValidatorRef: PollShardValidatorRef;
    stabilityPoolValidatorRef: StabilityPoolValidatorRef;
    stakingValidatorRef: StakingValidatorRef;
    treasuryValidatorRef: TreasuryValidatorRef;
    versionRecordTokenPolicyRef: VersionRecordTokenPolicyRef;
    versionRegistryValidatorRef: VersionRegistryValidatorRef;
}
export interface AuthTokenPolicies {
    accountTokenRef: AccountTokenRef;
    cdpAuthTokenRef: CdpAuthTokenRef;
    iAssetTokenRef: IAssetTokenRef;
    pollManagerTokenRef: PollManagerTokenRef;
    snapshotEpochToScaleToSumTokenRef: SnapshotEpochToScaleToSumTokenRef;
    stabilityPoolTokenRef: StabilityPoolTokenRef;
    stakingTokenRef: StakingTokenRef;
    upgradeTokenRef: UpgradeTokenRef;
}
export interface AccountTokenRef {
    input: Input;
    output: Output;
}
export interface Input {
    index: number;
    transactionId: string;
}
export interface Output {
    output: Output1;
    scriptRef: ScriptRef;
}
export interface Output1 {
    address: Address;
    amount: Amount;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Address {
    addressCredential: AddressCredentialOrDatum;
    addressStakingCredential?: null;
}
export interface AddressCredentialOrDatum {
    contents: string;
    tag: string;
}
export interface Amount {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface TokenName {
    unTokenName: string;
}
export interface ScriptRef {
    contents?: string[] | null;
    tag: string;
}
export interface CdpAuthTokenRef {
    input: Input;
    output: Output2;
}
export interface Output2 {
    output: Output3;
    scriptRef: ScriptRef;
}
export interface Output3 {
    address: Address;
    amount: Amount1;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount1 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface IAssetTokenRef {
    input: Input;
    output: Output4;
}
export interface Output4 {
    output: Output5;
    scriptRef: ScriptRef;
}
export interface Output5 {
    address: Address;
    amount: Amount2;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount2 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface PollManagerTokenRef {
    input: Input;
    output: Output6;
}
export interface Output6 {
    output: Output7;
    scriptRef: ScriptRef;
}
export interface Output7 {
    address: Address;
    amount: Amount3;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount3 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface SnapshotEpochToScaleToSumTokenRef {
    input: Input;
    output: Output8;
}
export interface Output8 {
    output: Output9;
    scriptRef: ScriptRef;
}
export interface Output9 {
    address: Address;
    amount: Amount4;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount4 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface StabilityPoolTokenRef {
    input: Input;
    output: Output10;
}
export interface Output10 {
    output: Output11;
    scriptRef: ScriptRef;
}
export interface Output11 {
    address: Address;
    amount: Amount5;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount5 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface StakingTokenRef {
    input: Input;
    output: Output12;
}
export interface Output12 {
    output: Output13;
    scriptRef: ScriptRef;
}
export interface Output13 {
    address: Address;
    amount: Amount6;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount6 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface UpgradeTokenRef {
    input: Input;
    output: Output14;
}
export interface Output14 {
    output: Output15;
    scriptRef: ScriptRef;
}
export interface Output15 {
    address: Address;
    amount: Amount7;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount7 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface CdpCreatorValidatorRef {
    input: Input;
    output: Output16;
}
export interface Output16 {
    output: Output17;
    scriptRef: ScriptRef;
}
export interface Output17 {
    address: Address;
    amount: Amount8;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount8 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface CdpValidatorRef {
    input: Input;
    output: Output18;
}
export interface Output18 {
    output: Output19;
    scriptRef: ScriptRef;
}
export interface Output19 {
    address: Address;
    amount: Amount9;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount9 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface CollectorValidatorRef {
    input: Input;
    output: Output20;
}
export interface Output20 {
    output: Output21;
    scriptRef: ScriptRef;
}
export interface Output21 {
    address: Address;
    amount: Amount10;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount10 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface ExecuteValidatorRef {
    input: Input;
    output: Output22;
}
export interface Output22 {
    output: Output23;
    scriptRef: ScriptRef;
}
export interface Output23 {
    address: Address;
    amount: Amount11;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount11 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface GovernanceValidatorRef {
    input: Input;
    output: Output24;
}
export interface Output24 {
    output: Output25;
    scriptRef: ScriptRef;
}
export interface Output25 {
    address: Address;
    amount: Amount12;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount12 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface IAssetTokenPolicyRef {
    input: Input;
    output: Output26;
}
export interface Output26 {
    output: Output27;
    scriptRef: ScriptRef;
}
export interface Output27 {
    address: Address;
    amount: Amount13;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount13 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface LiquidityValidatorRef {
    input: Input;
    output: Output28;
}
export interface Output28 {
    output: Output29;
    scriptRef: ScriptRef;
}
export interface Output29 {
    address: Address;
    amount: Amount14;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount14 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface PollManagerValidatorRef {
    input: Input;
    output: Output30;
}
export interface Output30 {
    output: Output31;
    scriptRef: ScriptRef;
}
export interface Output31 {
    address: Address;
    amount: Amount15;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount15 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface PollShardValidatorRef {
    input: Input;
    output: Output32;
}
export interface Output32 {
    output: Output33;
    scriptRef: ScriptRef;
}
export interface Output33 {
    address: Address;
    amount: Amount16;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount16 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface StabilityPoolValidatorRef {
    input: Input;
    output: Output34;
}
export interface Output34 {
    output: Output35;
    scriptRef: ScriptRef;
}
export interface Output35 {
    address: Address;
    amount: Amount17;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount17 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface StakingValidatorRef {
    input: Input;
    output: Output36;
}
export interface Output36 {
    output: Output37;
    scriptRef: ScriptRef;
}
export interface Output37 {
    address: Address;
    amount: Amount18;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount18 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface TreasuryValidatorRef {
    input: Input;
    output: Output38;
}
export interface Output38 {
    output: Output39;
    scriptRef: ScriptRef;
}
export interface Output39 {
    address: Address;
    amount: Amount19;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount19 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface VersionRecordTokenPolicyRef {
    input: Input;
    output: Output40;
}
export interface Output40 {
    output: Output41;
    scriptRef: ScriptRef;
}
export interface Output41 {
    address: Address;
    amount: Amount20;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount20 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface VersionRegistryValidatorRef {
    input: Input;
    output: Output42;
}
export interface Output42 {
    output: Output43;
    scriptRef: ScriptRef;
}
export interface Output43 {
    address: Address;
    amount: Amount21;
    datum: AddressCredentialOrDatum;
    referenceScript: string;
}
export interface Amount21 {
    getValue?:
        | ((CurrencySymbol | (number[] | null)[] | null)[] | null)[]
        | null;
}
export interface StabilityPoolParams {
    accountToken: AssetClass;
    assetSymbol: CurrencySymbol;
    cdpToken?: AssetClass;
    collectorValHash: string;
    govNFT?: AssetClass;
    snapshotEpochToScaleToSumToken?: AssetClass;
    stabilityPoolToken: AssetClass;
    versionRecordToken?: AssetClass;
}
export interface StakingParams {
    collectorValHash: string;
    indyToken: AssetClass;
    pollToken?: AssetClass;
    stakingManagerNFT: AssetClass;
    stakingToken: AssetClass;
    versionRecordToken?: AssetClass;
}
export interface TreasuryParams {
    versionRecordToken?: AssetClass;
}
export interface VersionRecordParams {
    upgradeToken?: AssetClass;
}

// Returns the CDP creator address based on the system parameters and network ID.
export function getCdpCreatorAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.cdpCreatorHash, networkId);
}

// Returns the CDP address based on the system parameters and network ID.
export function getCdpAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.cdpHash, networkId);
}

// Returns the collector address based on the system parameters and network ID.
export function getCollectorAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.collectorHash, networkId);
}

// Returns the execute address based on the system parameters and network ID.
export function getExecuteAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.executeHash, networkId);
}

// Returns the governance address based on the system parameters and network ID.
export function getGovernanceAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.govHash, networkId);
}

// Returns the poll manager address based on the system parameters and network ID.
export function getPollManagerAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.pollManagerHash, networkId);
}

// Returns the poll shard address based on the system parameters and network ID.
export function getPollShardAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.pollShardHash, networkId);
}

// Returns the stability pool address based on the system parameters and network ID.
export function getStabilityPoolAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.stabilityPoolHash, networkId);
}

// Returns the staking address based on the system parameters and network ID.
export function getStakingAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.stakingHash, networkId);
}

// Returns the treasury address based on the system parameters and network ID.
export function getTreasuryAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.treasuryHash, networkId);
}

// Returns the version registry address based on the system parameters and network ID.
export function getVersionRegistryAddress(systemParams: SystemParamsV2, networkId: string): string {
    return toAddress(systemParams.validatorHashes.versionRegistryHash, networkId);
}
