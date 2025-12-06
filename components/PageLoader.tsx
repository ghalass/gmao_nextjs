import { Loader, Loader2, LoaderCircle, LoaderPinwheel } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="flex justify-center items-center">
      <Loader className="h-1 w-1 animate-spin " />
    </div>
  );
}
