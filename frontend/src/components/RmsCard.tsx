import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import type { CardProps } from "@heroui/react";

interface RmscardProps extends CardProps {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function RmsCard({
  title,
  subtitle,
  footer,
  children,
  classNames = {},
  ...props
}: RmscardProps) {
  return (
    <Card
      {...props}
      // style={{
      //     backgroundColor: 'var(--heroui-off, #F5F5F5)',
      //     borderWidth: '2px',
      //     borderStyle: 'solid',
      //     borderColor: 'var(--heroui-border-off, #E5E7EB)',
      // }}
      classNames={{
        ...classNames,
        base: `bg-content1 ${classNames.base || ""}`,
      }}
    >
      {(title || subtitle) && (
        <CardHeader className="flex flex-col items-start gap-1 px-6">
          {title && (
            <h3 className="text-xl font-bold text-foreground font-sans">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-dull font-sans">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardBody className="px-6">{children}</CardBody>
      {footer && <CardFooter className="px-6 py-4">{footer}</CardFooter>}
    </Card>
  );
}
