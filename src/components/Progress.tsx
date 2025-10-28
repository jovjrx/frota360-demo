import { Box, Text, Progress as ChakraProgress, HStack, VStack, Badge } from "@chakra-ui/react";
import { useEffect, useState, useMemo, useRef } from "react";

interface ProgressProps {
  title?: string;
  description?: string;
  currentValue: number | string;
  totalValue: number | string;
  unit?: string;                        // pode ser undefined
  colorScheme?: string;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
  variant?: "default" | "gradient" | "striped" | "glow";
}

export const Progress = ({
  // title, description, // ignorados no layout (o Card externo já exibe)
  currentValue,
  totalValue,
  unit,
  colorScheme = "brand",
  size = "md",
  showPercentage = true,
  animated = true,
  variant = "default",
}: ProgressProps) => {
  // normalização segura
  const cur = useMemo(() => {
    const n = Number(currentValue);
    return Number.isFinite(n) ? n : 0;
  }, [currentValue]);

  const tot = useMemo(() => {
    const n = Number(totalValue);
    return Number.isFinite(n) && n > 0 ? n : 100; // evita /0 e default 100
  }, [totalValue]);

  const percentageRaw = (cur / tot) * 100;
  const percentage = useMemo(() => Math.max(0, Math.min(100, Math.round(percentageRaw))), [percentageRaw]);

  const isPercentOfHundred = unit === "%" && tot === 100;

  const [barValue, setBarValue] = useState(0);      // 0..100 para a barra
  const [displayValue, setDisplayValue] = useState(0); // contagem do valor absoluto
  const [inView, setInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const bgColor = "gray.100";
  const textColor = "gray.700";
  const cardBg = "white";

  // IntersectionObserver: anima ao entrar em viewport (uma vez)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setInView(true);
        });
      },
      { threshold: 0.25 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // animação suave da barra e do número quando visível
  useEffect(() => {
    const shouldAnimate = animated && inView && !hasAnimated;
    const finalBar = percentage;
    const finalValue = cur;

    if (!shouldAnimate) {
      if (!animated) {
        setBarValue(finalBar);
        setDisplayValue(finalValue);
      }
      return;
    }

    const duration = 900; // ms
    const start = performance.now();
    const startBar = 0;
    const startVal = 0;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3); // cúbica

    const raf = () => {
      const now = performance.now();
      const t = Math.min(1, (now - start) / duration);
      const e = easeOut(t);

      setBarValue(Math.round(startBar + (finalBar - startBar) * e));
      setDisplayValue(Math.round(startVal + (finalValue - startVal) * e));

      if (t < 1) {
        requestAnimationFrame(raf);
      } else {
        setHasAnimated(true);
      }
    };

    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [animated, inView, hasAnimated, percentage, cur]);

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return { height: "8px", valueSize: "xl", gap: 3, padding: 3 };
      case "lg":
        return { height: "16px", valueSize: "3xl", gap: 5, padding: 5 };
      default:
        return { height: "12px", valueSize: "2xl", gap: 4, padding: 4 };
    }
  };
  const sizeStyles = getSizeStyles();

  const formatNumber = (num: number) => {
    if (!Number.isFinite(num)) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const mainDisplay = isPercentOfHundred
    ? `${barValue}%`
    : `${formatNumber(displayValue)} / ${formatNumber(tot)}`;

  const getVariantStyles = () => {
    switch (variant) {
      case "gradient":
        return {
          progressBg: `linear-gradient(90deg, var(--chakra-colors-${colorScheme}-400), var(--chakra-colors-${colorScheme}-600))`,
          shadow: `0 0 20px var(--chakra-colors-${colorScheme}-200)`,
          border: `2px solid var(--chakra-colors-${colorScheme}-300)`,
        };
      case "striped":
        return {
          progressBg: `var(--chakra-colors-${colorScheme}-500)`,
          shadow: `0 0 15px var(--chakra-colors-${colorScheme}-300)`,
          border: `1px solid var(--chakra-colors-${colorScheme}-400)`,
        };
      case "glow":
        return {
          progressBg: `var(--chakra-colors-${colorScheme}-500)`,
          shadow: `0 0 25px var(--chakra-colors-${colorScheme}-400), inset 0 0 10px var(--chakra-colors-${colorScheme}-200)`,
          border: `2px solid var(--chakra-colors-${colorScheme}-400)`,
        };
      default:
        return {
          progressBg: `var(--chakra-colors-${colorScheme}-500)`,
          shadow: `0 0 10px var(--chakra-colors-${colorScheme}-200)`,
          border: `1px solid var(--chakra-colors-${colorScheme}-300)`,
        };
    }
  };
  const variantStyles = getVariantStyles();

  return (
    <Box
      ref={containerRef}
      w="full"
      transition="all 0.3s ease"
    >
      <VStack spacing={2} align="center" mb={2}>
        <Text fontWeight="extrabold" fontSize={sizeStyles.valueSize} lineHeight={1.1} color={`${colorScheme}.600`}>
          {mainDisplay}
          {/* Se a unidade existir e não for % de 100, mostramos ao lado do valor (pequeno) */}
          {!isPercentOfHundred && unit ? (
            <Text as="span" fontSize="md" fontWeight="semibold" color={`${colorScheme}.500`} ml={2}>
              {unit}
            </Text>
          ) : null}
        </Text>

      </VStack>
      <Box position="relative">
        <ChakraProgress
          value={barValue}
          colorScheme={colorScheme as any}
          height={sizeStyles.height}
          borderRadius="full"
          bg={bgColor}
          overflow="hidden"
          transition={animated ? "all 1s cubic-bezier(0.4, 0, 0.2, 1)" : "none"}
          sx={{
            "& > div": {
              background: variantStyles.progressBg,
              boxShadow: variantStyles.shadow,
              border: variantStyles.border,
              borderRadius: "full",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  variant === "striped"
                    ? `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
                    : `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                animation: animated
                  ? variant === "striped"
                    ? "striped 2s linear infinite"
                    : "shimmer 2s infinite"
                  : "none",
              },
            },
          }}
        />

        {/* Indicador luminoso opcional */}
        {variant === "glow" && animated && (
          <Box
            position="absolute"
            top="-8px"
            left={`${Math.min(barValue, 95)}%`}
            transform="translateX(-50%)"
            width="4px"
            height="32px"
            bg={`${colorScheme}.400`}
            borderRadius="full"
            boxShadow={`0 0 15px ${colorScheme}.400`}
            transition="left 1s cubic-bezier(0.4, 0, 0.2, 1)"
            _before={{
              content: '""',
              position: "absolute",
              top: "-4px",
              left: "-2px",
              width: "8px",
              height: "8px",
              bg: `${colorScheme}.300`,
              borderRadius: "full",
              boxShadow: `0 0 10px ${colorScheme}.300`,
            }}
          />
        )}
      </Box>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes striped {
          0% { transform: translateX(0); }
          100% { transform: translateX(40px); }
        }
      `}</style>
    </Box>
  );
};

