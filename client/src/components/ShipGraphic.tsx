interface ShipGraphicProps {
  type: string;
  isVertical: boolean;
  cells?: {x: number, y: number}[];
  isDestroyed?: boolean;
}

export const ShipGraphic: React.FC<ShipGraphicProps> = ({ type, isVertical, cells, isDestroyed }) => {
  let content = null;

  switch(type) {
    case 'carrier':
      content = (
        <div className="w-full h-full bg-slate-600 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-slate-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            <div className={`absolute border-dashed border-slate-400 ${isVertical ? 'h-full border-l-2' : 'w-full border-t-2'}`}></div>
            <div className={`absolute bg-slate-700 rounded-sm shadow-xl ${isVertical ? 'right-1 w-2 h-8' : 'bottom-1 h-2 w-8'}`}></div>
        </div>
      );
      break;
    case 'battleship':
      content = (
        <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center relative border-2 border-slate-600 shadow-[inset_0_0_15px_rgba(0,0,0,0.6)]">
            <div className={`absolute bg-slate-400 rounded-full shadow-md ${isVertical ? 'w-4 h-4 top-2' : 'w-4 h-4 left-2'}`}></div>
            <div className={`absolute bg-slate-400 rounded-full shadow-md ${isVertical ? 'w-4 h-4 bottom-2' : 'w-4 h-4 right-2'}`}></div>
            <div className={`absolute bg-slate-800 ${isVertical ? 'w-6 h-8' : 'w-8 h-6'} rounded-md`}></div>
        </div>
      );
      break;
    case 'cruiser':
      content = (
        <div className="w-full h-full bg-slate-500 rounded-full flex items-center justify-center relative border border-slate-400">
            <div className={`absolute bg-slate-300 rounded-full shadow-md ${isVertical ? 'w-3 h-3 top-2' : 'w-3 h-3 left-2'}`}></div>
            <div className={`absolute bg-slate-600 ${isVertical ? 'w-4 h-6' : 'w-6 h-4'} rounded-sm`}></div>
        </div>
      );
      break;
    case 'submarine':
      // 2x2 bounding box. We draw the L-shape using SVG
      content = (
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg opacity-90" preserveAspectRatio="none">
             <path 
                d={isVertical ? "M 10 10 L 190 10 L 190 190 L 100 190 L 100 100 L 10 100 Z" : "M 10 10 L 190 10 L 190 100 L 100 100 L 100 190 L 10 190 Z"} 
                fill="#083344" stroke="#0e7490" strokeWidth="10" strokeLinejoin="round" />
             <circle cx={isVertical ? "145" : "55"} cy={isVertical ? "55" : "55"} r="15" fill="#ef4444" className="animate-pulse" />
          </svg>
      );
      break;
    case 'destroyer':
      content = (
        <div className="w-full h-full bg-slate-400 rounded-full flex items-center justify-center relative border border-slate-300">
             <div className={`absolute bg-slate-600 ${isVertical ? 'w-2 h-4' : 'w-4 h-2'} rounded-sm`}></div>
        </div>
      );
      break;
  }

  let gridStyle = {};
  if (cells && cells.length > 0) {
      const minX = Math.min(...cells.map(c => c.x));
      const maxX = Math.max(...cells.map(c => c.x));
      const minY = Math.min(...cells.map(c => c.y));
      const maxY = Math.max(...cells.map(c => c.y));

      gridStyle = {
          gridColumn: `${minX + 1} / span ${maxX - minX + 1}`,
          gridRow: `${minY + 1} / span ${maxY - minY + 1}`
      };
  }

  return (
    <div style={gridStyle} className={`relative min-w-0 min-h-0 w-full h-full pointer-events-none drop-shadow-2xl z-10 transition-all duration-700 ${isDestroyed ? 'brightness-50 sepia-[.3] hue-rotate-[-10deg] grayscale-[0.8]' : ''}`}>
      <div className="absolute inset-0 w-full h-full p-1">
        {content}
      </div>
    </div>
  );
};
