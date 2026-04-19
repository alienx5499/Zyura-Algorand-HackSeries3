import { handleCreate } from "@/app/api/zyura/mint-policy-nft/actions/create";
import { handleCreateBeforePurchase } from "@/app/api/zyura/mint-policy-nft/actions/create-before-purchase";
import { handleSignGroupedTransfer } from "@/app/api/zyura/mint-policy-nft/actions/sign-grouped-transfer";
import { handleTransfer } from "@/app/api/zyura/mint-policy-nft/actions/transfer";
import { handleUnsignedTransfer } from "@/app/api/zyura/mint-policy-nft/actions/unsigned-transfer";
import type {
  ActionHandler,
  MintAction,
} from "@/app/api/zyura/mint-policy-nft/types";

export const handlerMap: Record<MintAction, ActionHandler> = {
  createBeforePurchase: handleCreateBeforePurchase,
  unsignedTransfer: handleUnsignedTransfer,
  unsignedNftDelivery: handleUnsignedTransfer,
  signGroupedTransfer: handleSignGroupedTransfer,
  signNftDelivery: handleSignGroupedTransfer,
  create: handleCreate,
  transfer: handleTransfer,
};
