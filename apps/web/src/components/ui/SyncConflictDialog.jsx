/**
 * 同步冲突对话框
 *
 * 当本地和云端数据有冲突时，让用户选择保留哪个版本
 */

import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cloud, HardDrive, AlertTriangle } from 'lucide-react'

export default function SyncConflictDialog({
  open,
  onOpenChange,
  conflict,
  onResolve,
}) {
  if (!conflict) return null

  const handleChoose = (choice) => {
    onResolve(choice)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-[90vw] max-w-md bg-card rounded-lg shadow-xl z-50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30
                                flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-semibold">
                      数据冲突
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">
                      检测到本地和云端数据不一致
                    </Dialog.Description>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm">
                    <strong>{conflict.bookTitle || '数据'}</strong> 存在冲突，请选择保留哪个版本：
                  </p>

                  {/* 云端版本 */}
                  <button
                    onClick={() => handleChoose('cloud')}
                    className="w-full p-4 rounded-lg border border-border hover:border-primary
                             hover:bg-primary/5 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Cloud className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium group-hover:text-primary transition-colors">
                          使用云端版本
                        </div>
                        {conflict.cloudInfo && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {conflict.cloudInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* 本地版本 */}
                  <button
                    onClick={() => handleChoose('local')}
                    className="w-full p-4 rounded-lg border border-border hover:border-primary
                             hover:bg-primary/5 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <div className="font-medium group-hover:text-primary transition-colors">
                          使用本地版本
                        </div>
                        {conflict.localInfo && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {conflict.localInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  选择后，另一个版本将被覆盖
                </div>

                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 p-1 rounded-full
                             hover:bg-muted transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
