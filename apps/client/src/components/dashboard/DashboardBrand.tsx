import Image from "next/image";

const MOTTO = "LA REALTÀ È SOLO UN SOGNO CHE SANGUINA.";

type Props = {
  /** Header mobile compatto — nasconde il motto su schermi stretti */
  compact?: boolean;
};

export function DashboardBrand({ compact = false }: Props) {
  return (
    <div className="dashboard-brand">
      <Image
        src="/icon.png"
        alt=""
        width={40}
        height={40}
        className="dashboard-brand__icon"
        priority
      />
      <div className="dashboard-brand__text min-w-0">
        <p className="dashboard-brand__title">Oyasumi</p>
        {!compact && <p className="dashboard-brand__motto">{MOTTO}</p>}
      </div>
    </div>
  );
}
