import type { MarketIndex } from "../types";
import { ToneValue } from "./ui";

export function MarketTape({ indexes }: { indexes: MarketIndex[] }) {
  return (
    <div className="market-tape" aria-label="market snapshot">
      {indexes.map((item) => (
        <div className="tape-item" key={item.symbol}>
          <div>
            <span className="tape-symbol">{item.symbol}</span>
            <span className="tape-name">{item.name}</span>
          </div>
          <strong>{item.value.toLocaleString("zh-TW")}</strong>
          <ToneValue value={item.changePct} compact />
        </div>
      ))}
    </div>
  );
}
