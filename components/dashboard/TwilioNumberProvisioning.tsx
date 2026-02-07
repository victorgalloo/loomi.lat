'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, Search, Loader2, CheckCircle, AlertCircle, Globe, Copy, ArrowLeft } from 'lucide-react';

type Step = 'idle' | 'searching' | 'results' | 'confirming' | 'purchasing' | 'purchased';

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  monthlyPrice: number;
}

interface ProvisionedNumber {
  id: string;
  phoneNumber: string;
  friendlyName: string | null;
  countryCode: string;
  status: string;
  monthlyCost: number | null;
  verificationCode: string | null;
  verificationCodeExpiresAt: string | null;
}

interface TwilioNumberProvisioningProps {
  onNumberPurchased?: (number: ProvisionedNumber) => void;
  onConnectWhatsApp?: (phoneNumber: string) => void;
  onBack?: () => void;
}

export default function TwilioNumberProvisioning({
  onNumberPurchased,
  onConnectWhatsApp,
  onBack,
}: TwilioNumberProvisioningProps) {
  const [step, setStep] = useState<Step>('idle');
  const [country, setCountry] = useState<'MX' | 'US'>('MX');
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<AvailableNumber | null>(null);
  const [purchasedNumber, setPurchasedNumber] = useState<ProvisionedNumber | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const searchNumbers = async () => {
    setStep('searching');
    setError(null);

    try {
      const res = await fetch(`/api/twilio/numbers/search?country=${country}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error buscando números');

      setNumbers(data.numbers);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStep('idle');
    }
  };

  const confirmPurchase = (number: AvailableNumber) => {
    setSelectedNumber(number);
    setStep('confirming');
  };

  const executePurchase = async () => {
    if (!selectedNumber) return;
    setStep('purchasing');
    setError(null);

    try {
      const res = await fetch('/api/twilio/numbers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: selectedNumber.phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error comprando número');

      setPurchasedNumber(data.number);
      setStep('purchased');
      onNumberPurchased?.(data.number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStep('confirming');
    }
  };

  const startPollingVerification = () => {
    if (!purchasedNumber || pollingRef.current) return;
    setIsPolling(true);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/twilio/numbers/${purchasedNumber.id}/verification`);
        const data = await res.json();

        if (data.code) {
          setVerificationCode(data.code);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setIsPolling(false);
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  };

  const copyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
    }
  };

  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-terminal-red" />
          <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
          <div className="w-3 h-3 rounded-full bg-terminal-green" />
        </div>
        <span className="text-xs font-mono text-muted ml-2">obtener_numero</span>
      </div>

      <div className="p-5">
        {/* Step: Country Selection */}
        {step === 'idle' && (
          <div className="space-y-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors font-mono"
              >
                <ArrowLeft className="w-3 h-3" />
                volver
              </button>
            )}

            <div className="text-center space-y-2">
              <Globe className="w-8 h-8 text-muted mx-auto" />
              <h3 className="text-sm font-medium text-foreground font-mono">
                selecciona un país
              </h3>
              <p className="text-xs text-muted">
                Compra un número nuevo para conectar con WhatsApp Business
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['MX', 'US'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-mono transition-colors ${
                    country === c
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:border-muted'
                  }`}
                >
                  <span>{c === 'MX' ? '🇲🇽' : '🇺🇸'}</span>
                  {c === 'MX' ? 'México' : 'Estados Unidos'}
                </button>
              ))}
            </div>

            <button
              onClick={searchNumbers}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium font-mono transition-colors hover:opacity-90"
            >
              <Search className="w-4 h-4" />
              buscar números disponibles
            </button>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-terminal-red/10 border border-terminal-red/20">
                <AlertCircle className="w-4 h-4 text-terminal-red flex-shrink-0 mt-0.5" />
                <p className="text-xs text-terminal-red">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Step: Searching */}
        {step === 'searching' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-6 h-6 text-muted animate-spin" />
            <p className="text-sm text-muted font-mono">buscando números en {country}...</p>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground font-mono">
                {numbers.length} números disponibles
              </h3>
              <button
                onClick={() => { setStep('idle'); setNumbers([]); }}
                className="text-xs text-muted hover:text-foreground transition-colors font-mono"
              >
                cambiar país
              </button>
            </div>

            {numbers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted">No se encontraron números disponibles.</p>
                <button
                  onClick={() => setStep('idle')}
                  className="mt-2 text-xs text-muted hover:text-foreground font-mono"
                >
                  intentar de nuevo
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {numbers.map((num) => (
                  <button
                    key={num.phoneNumber}
                    onClick={() => confirmPurchase(num)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-muted bg-background transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted" />
                      <div>
                        <p className="text-sm font-mono text-foreground">{num.phoneNumber}</p>
                        {(num.locality || num.region) && (
                          <p className="text-xs text-muted">
                            {[num.locality, num.region].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted">
                      ${num.monthlyPrice.toFixed(2)}/mes
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Confirm Purchase */}
        {step === 'confirming' && selectedNumber && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Phone className="w-8 h-8 text-terminal-green mx-auto" />
              <h3 className="text-sm font-medium text-foreground font-mono">
                confirmar compra
              </h3>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted font-mono">número</span>
                <span className="text-sm font-mono text-foreground">{selectedNumber.phoneNumber}</span>
              </div>
              {(selectedNumber.locality || selectedNumber.region) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted font-mono">ubicación</span>
                  <span className="text-sm text-foreground">
                    {[selectedNumber.locality, selectedNumber.region].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted font-mono">costo mensual</span>
                <span className="text-sm font-mono font-medium text-foreground">
                  ${selectedNumber.monthlyPrice.toFixed(2)} USD
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-terminal-red/10 border border-terminal-red/20">
                <AlertCircle className="w-4 h-4 text-terminal-red flex-shrink-0 mt-0.5" />
                <p className="text-xs text-terminal-red">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setStep('results'); setError(null); }}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-mono text-foreground hover:bg-surface-2 transition-colors"
              >
                cancelar
              </button>
              <button
                onClick={executePurchase}
                className="px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium font-mono transition-colors hover:opacity-90"
              >
                comprar número
              </button>
            </div>
          </div>
        )}

        {/* Step: Purchasing */}
        {step === 'purchasing' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-6 h-6 text-terminal-green animate-spin" />
            <p className="text-sm text-muted font-mono">comprando número...</p>
            <p className="text-xs text-muted">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Step: Purchased */}
        {step === 'purchased' && purchasedNumber && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-terminal-green mx-auto" />
              <h3 className="text-sm font-medium text-foreground font-mono">
                número activo
              </h3>
              <p className="text-lg font-mono text-foreground">{purchasedNumber.phoneNumber}</p>
            </div>

            {/* Verification Code Panel */}
            {verificationCode ? (
              <div className="rounded-lg border border-terminal-green/30 bg-terminal-green/5 p-4 text-center space-y-2">
                <p className="text-xs text-muted font-mono">código de verificación</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold text-terminal-green tracking-widest">
                    {verificationCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                    title="Copiar código"
                  >
                    <Copy className="w-4 h-4 text-muted" />
                  </button>
                </div>
                <p className="text-xs text-muted">Ingresa este código en la ventana de Meta</p>
              </div>
            ) : isPolling ? (
              <div className="rounded-lg border border-border p-4 text-center space-y-2">
                <Loader2 className="w-5 h-5 text-muted animate-spin mx-auto" />
                <p className="text-xs text-muted font-mono">esperando código de verificación...</p>
                <p className="text-xs text-muted">El código aparecerá automáticamente cuando Meta envíe el SMS</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <button
                onClick={() => {
                  startPollingVerification();
                  onConnectWhatsApp?.(purchasedNumber.phoneNumber);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium font-mono transition-colors hover:opacity-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                conectar a WhatsApp
              </button>

              {!isPolling && !verificationCode && (
                <p className="text-xs text-center text-muted">
                  Al conectar, se monitoreará automáticamente el SMS de verificación de Meta
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
