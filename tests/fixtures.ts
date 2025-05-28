import { Asset } from '../src/db/entities/Asset';

export const ASSETS = {
  USDC: Asset.fromId(
    '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534443'
  ),
  iUSD: Asset.fromId(
    'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69555344'
  ),
  DJED: Asset.fromId(
    '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344'
  ),
  USDM: Asset.fromId(
    'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d'
  ),
  USDA: Asset.fromId(
    'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456.55534441'
  ),
};
