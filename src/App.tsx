// @ts-nocheck
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import { Feature, Map, View } from "ol";
import { fromLonLat } from "ol/proj";
import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Fill, Icon, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import kompas from "kompas";
import { Point } from "ol/geom";
import logo from "./assets/navigation.svg";
import Control from "ol/control/Control";
import { circular } from "ol/geom/Polygon";
import { Link } from "react-router-dom";
const App = () => {
  const [mapContent, setMapContent] = useState(null);
  const mapRef = useRef(null);
  // const locateRef = useRef(null);
  useEffect(() => {
    if (mapRef.current !== null) {
      console.log("test", "test");

      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
        }),
      });
      setMapContent(map);
    }

    return () => {};
  }, [mapRef]);

  useEffect(() => {
    if (!mapContent) return;
    const source = new VectorSource();
    const layer = new VectorLayer({
      source: source,
    });
    mapContent?.addLayer(layer);

    navigator.geolocation.watchPosition(
      function (pos) {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        source.clear(true);
        source.addFeatures([
          new Feature(
            circular(coords, pos.coords.accuracy).transform(
              "EPSG:4326",
              mapContent.getView().getProjection()
            )
          ),
          new Feature(new Point(fromLonLat(coords))),
        ]);
      },
      function (error) {
        alert(`ERROR: ${error.message}`);
      },
      {
        enableHighAccuracy: false,
      }
    );

    const locate = document.createElement("div");
    locate.className = "ol-control ol-unselectable locate";
    locate.innerHTML = '<button title="Locate me">◎</button>';
    locate.addEventListener("click", function () {
      if (!source.isEmpty()) {
        mapContent.getView().fit(source.getExtent(), {
          maxZoom: 18,
          duration: 500,
        });
      }
    });
    mapContent.addControl(
      new Control({
        element: locate,
      })
    );
    //! [style]
    const style = new Style({
      fill: new Fill({
        color: "rgba(0, 0, 255, 0.2)",
      }),
      image: new Icon({
        src: logo,
        scale: 0.02,
        imgSize: [27, 55],
        rotateWithView: true,
      }),
    });
    layer.setStyle(style);
    //! [style]
    //! [kompas]
    function startCompass() {
      kompas()
        .watch()
        .on("heading", function (heading) {
          console.log(`Heading: ${heading}`);

          style.getImage().setRotation((Math.PI / 180) * heading);
        });
    }

    if (
      window.DeviceOrientationEvent &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      locate.addEventListener("click", function () {
        DeviceOrientationEvent.requestPermission()
          .then(startCompass)
          .catch(function (error) {
            alert(`ERROR: ${error.message}`);
          });
      });
    } else if ("ondeviceorientationabsolute" in window) {
      startCompass();
    } else {
      alert("No device orientation provided by device");
    }
  }, [mapContent]);

  return (
    <div
      id="map-container"
      style={{ height: "800px", width: "800px" }}
      ref={mapRef}
    >
      <Link to="/compass-openlayer/compass">New Compass Route</Link>
    </div>
  );
};

export default App;
