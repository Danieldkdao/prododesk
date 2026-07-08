import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
};

export const OTPInput = ({ value, onChange, length = 6 }: OTPInputProps) => {
  return (
    <div className="w-full">
      <InputOTP
        maxLength={length}
        value={value}
        onChange={onChange}
        containerClassName="w-full"
      >
        <InputOTPGroup className="w-full justify-between gap-2">
          {Array.from({ length }).map((_, index) => (
            <InputOTPSlot className="flex-1" index={index} key={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
};
