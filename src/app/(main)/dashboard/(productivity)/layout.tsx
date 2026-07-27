import { ReactNode } from "react";

const ProductivityLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-10 max-w-384 mx-auto">
        {children}
      </div>
    </div>
  );
};

export default ProductivityLayout;
