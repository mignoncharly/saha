"use client";
import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

interface Props {
  value: string;
}

export default function QRCode({ value }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, { width: 128 });
    }
  }, [value]);

  return <canvas ref={canvasRef} />;
}