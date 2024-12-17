import * as d3 from "d3";
import { FeatureCollection } from "geojson";

type MapProps = {
  width: number;
  height: number;
  data: FeatureCollection;
  numData: { code: string; value: number }[];
};

const handleClick = (e: React.MouseEvent<SVGPathElement>, geoId: string) => {
  console.log(geoId);
};

export const Map = ({ width, height, data, numData }: MapProps) => {
  const projection = d3.geoMercator().scale(4000).center([-84, 34.5]);

  const geoPathGenerator = d3.geoPath().projection(projection);

  var colorScale = d3
    .scaleThreshold<number, string>()
    .domain([1, 5, 20, 50, 200, 500])
    .range(d3.schemeReds[9]);
  console.log(data.features[0].properties?.GEOID);
  const allSvgPaths = data.features.map((shape) => {
    const regionData = numData.find(
      (region) => region.code === shape.properties?.GEOID
    );
    if (regionData) {
      console.log({ regionData });
    }
    const color = regionData ? colorScale(regionData?.value) : "lightgrey";
    return (
      <path
        key={shape.properties?.GEOID}
        d={geoPathGenerator(shape) || undefined}
        stroke="lightGrey"
        strokeWidth={0.5}
        fill={color}
        fillOpacity={0.7}
        onClick={(e) => handleClick(e, shape.properties?.GEOID)}
      />
    );
  });
  return (
    <div>
      <svg width={width} height={height}>
        {allSvgPaths}
      </svg>
    </div>
  );
};
