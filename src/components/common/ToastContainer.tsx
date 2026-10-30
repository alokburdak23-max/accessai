import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const config = {
          success: {
            icon: CheckCircle2,
            border: 'border-[#EEF0E3]',
            iconColor: 'text-[#648568]',
            bar: 'bg-[#648568]'
          },
          error: {
            icon: AlertCircle,
            border: 'border-[#F8E9ED]',
            iconColor: 'text-[#C94F55]',
            bar: 'bg-[#C94F55]'
          },
          warning: {
            icon: AlertTriangle,
            border: 'border-[#FDEEE2]',
            iconColor: 'text-[#D88A4C]',
            bar: 'bg-[#D88A4C]'
          },
          info: {
            icon: Info,
            border: 'border-[#EEF0E3]',
            iconColor: 'text-[#7B8053]',
            bar: 'bg-[#7B8053]'
          }
        }[toast.type];

        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-white shadow-dropdown transition-all duration-300 animate-in slide-in-from-bottom-2 ${config.border}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-semibold text-[#292A27]">{toast.title}</h5>
              {toast.message && (
                <p className="text-xs text-[#70716B] mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#999A92] hover:text-[#292A27] p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
