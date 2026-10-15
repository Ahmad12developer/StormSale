import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Receipt,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "../components/shared/Confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationReceipt {
  txHash?: string;
  amount?: string;
  saleId?: number | string;
  campaign?: string;
  date?: string;
  recipient?: string;
  explorerUrl?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  confetti?: boolean;
  receiptUrl?: string;
  receipt?: NotificationReceipt;
  onViewReceipt?: () => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, "id">) => void;
  dismissNotification: (id: string) => void;
  triggerConfetti: () => void;
  openReceiptModal: (receipt: NotificationReceipt) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<NotificationReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const triggerConfetti = useCallback(() => {
    setConfettiActive(false);
    setTimeout(() => {
      setConfettiActive(true);
    }, 10);
  }, []);

  const openReceiptModal = useCallback((receipt: NotificationReceipt) => {
    setActiveReceipt(receipt);
    setIsReceiptOpen(true);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(2, 11);
      const newNotification: Notification = { ...notification, id };

      setNotifications((prev) => [...prev, newNotification]);

      // Trigger celebratory confetti animation on success if requested or if it's a claim/reward
      const isClaimSuccess =
        notification.confetti ||
        (notification.type === "success" &&
          (notification.title.toLowerCase().includes("claim") ||
            notification.title.toLowerCase().includes("commission") ||
            notification.title.toLowerCase().includes("payout") ||
            notification.title.toLowerCase().includes("reward")));

      if (isClaimSuccess) {
        triggerConfetti();
      }

      // Auto dismiss after duration
      if (notification.duration !== 0) {
        setTimeout(() => {
          dismissNotification(id);
        }, notification.duration || 6000);
      }
    },
    [triggerConfetti, dismissNotification],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        dismissNotification,
        triggerConfetti,
        openReceiptModal,
      }}
    >
      {children}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />
      <NotificationContainer />
      <ReceiptModal
        receipt={activeReceipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, dismissNotification, openReceiptModal } = useNotification();

  const getIcon = (type: NotificationType, isReward: boolean) => {
    if (isReward) {
      return (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0 animate-bounce">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      );
    }
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case "error":
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
      case "info":
        return <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />;
    }
  };

  const getBackgroundColor = (type: NotificationType, isReward: boolean) => {
    if (isReward) {
      return "bg-gradient-to-br from-white via-indigo-50/50 to-amber-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/40 border-indigo-200 dark:border-indigo-500/40 shadow-xl shadow-indigo-500/10";
    }
    switch (type) {
      case "success":
        return "bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800/80 shadow-emerald-500/5";
      case "error":
        return "bg-white dark:bg-zinc-900 border-rose-200 dark:border-rose-800/80 shadow-rose-500/5";
      case "warning":
        return "bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-800/80 shadow-amber-500/5";
      case "info":
        return "bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800/80 shadow-indigo-500/5";
      default:
        return "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800";
    }
  };

  const handleReceiptClick = (notification: Notification) => {
    if (notification.onViewReceipt) {
      notification.onViewReceipt();
    } else if (notification.receipt) {
      openReceiptModal(notification.receipt);
    } else if (notification.receiptUrl) {
      window.open(notification.receiptUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => {
          const isReward =
            notification.confetti ||
            (notification.type === "success" &&
              (notification.title.toLowerCase().includes("claim") ||
                notification.title.toLowerCase().includes("commission") ||
                notification.title.toLowerCase().includes("payout") ||
                notification.title.toLowerCase().includes("reward") ||
                !!notification.receipt));

          const hasReceipt = Boolean(
            notification.receipt || notification.receiptUrl || notification.onViewReceipt,
          );

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`p-4 rounded-2xl border shadow-lg pointer-events-auto backdrop-blur-md transition-all ${getBackgroundColor(
                notification.type,
                Boolean(isReward),
              )}`}
            >
              <div className="flex items-start space-x-3">
                {getIcon(notification.type, Boolean(isReward))}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                      {notification.title}
                    </h4>
                    {isReward && (
                      <span className="inline-flex items-center text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                        Reward
                      </span>
                    )}
                  </div>
                  {notification.message && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed break-words">
                      {notification.message}
                    </p>
                  )}

                  {/* "View Receipt" Action Button */}
                  {hasReceipt && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleReceiptClick(notification)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-sm shadow-indigo-500/20"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </button>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        On-chain Verified
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const ReceiptModal: React.FC<{
  receipt: NotificationReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ receipt, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerLink =
    receipt.explorerUrl ||
    (receipt.txHash ? `https://stellar.expert/explorer/testnet/tx/${receipt.txHash}` : undefined);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white">
                Commission Payout Receipt
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Official cryptographic settlement confirmation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Settled on Soroban Smart Contract
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200">
              Confirmed
            </span>
          </div>

          {/* Key Payout Details */}
          <div className="space-y-2.5 text-xs">
            {receipt.amount && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">Claimed Amount</span>
                <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                  {receipt.amount}
                </span>
              </div>
            )}

            {receipt.saleId !== undefined && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">Sale ID</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  #{receipt.saleId}
                </span>
              </div>
            )}

            {receipt.campaign && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">Campaign</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                  {receipt.campaign}
                </span>
              </div>
            )}

            {receipt.date && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">Timestamp</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{receipt.date}</span>
              </div>
            )}

            {receipt.txHash && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">
                    Transaction Hash
                  </span>
                  <button
                    onClick={() => handleCopy(receipt.txHash || "")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 break-all select-all">
                  {receipt.txHash}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {explorerLink ? (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white transition-all shadow-sm"
            >
              <span>View in Stellar Expert</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div />
          )}

          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 text-xs font-semibold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export function NotificationWrapper({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

export function withNotification<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedWithNotification(props: P) {
    return (
      <NotificationProvider>
        <Component {...props} />
      </NotificationProvider>
    );
  };
}
