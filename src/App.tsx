import { FeatureCollection } from "geojson";
import "./App.css";
import { Map } from "./Map";
import rawdata from "./TN_counties.json";

const data = rawdata as FeatureCollection;
function App() {
  console.log("data", data);
  const numData = [
    { code: "47065", value: 100 },
    { code: "47115", value: 500 },
  ];
  return (
    <div className="App">
      <Map data={data} width={700} height={400} numData={numData} />
    </div>
  );
}

export default App;
