import { ErrorIcon } from "@/components/ui/icons";

export const ErrorInfo = ({ message }: { message: string }) => (
  <div className="p-3 h-full flex flex-row justify-center items-center text-red-500 dark:text-red-400">
    <ErrorIcon className="w-5 h-5 mr-2 flex-shrink-0" />
    <p className="text-sm font-semibold">{message}</p>
  </div>
);
