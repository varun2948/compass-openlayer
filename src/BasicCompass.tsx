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
const BasicCompass = () => {
  const [mapContent, setMapContent] = useState(null);
  const mapRef = useRef(null);
  useEffect(() => {
    if (mapRef.current !== null) {
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

    function handleReading(quaternion) {
      // https://w3c.github.io/orientation-sensor/#model explains the order of
      // the 4 elements in the sensor.quaternion array.
      let [qx, qy, qz, qw] = quaternion;

      // When the phone is lying flat, we want to treat the direction toward the
      // top of the phone as the "forward" direction; when the phone is held
      // upright, we want to treat the direction out the back of the phone as the
      // "forward" direction.  So, let's determine the compass heading of the
      // phone based on the vector between these directions, i.e. at a 45-degree
      // angle between the positive Y-axis and the negative Z-axis in this figure:
      // https://w3c.github.io/orientation-sensor/#absoluteorientationsensor-model

      // To find the current "forward" direction of the phone, we want to take this
      // vector, (0, 1, -1), and apply the same rotation as the phone's rotation.
      const y = 1;
      const z = -1;

      // From experimentation, it looks like the quaternion from the sensor is
      // the inverse rotation, so we need to flip the fourth component.
      qw = -qw;

      // This section explains how to convert the quaternion to a rotation matrix:
      // https://w3c.github.io/orientation-sensor/#convert-quaternion-to-rotation-matrix
      // Now let's multiply the forward vector by the rotation matrix.
      const rx =
        y * (2 * qx * qy + 2 * qw * qz) + z * (2 * qx * qz - 2 * qw * qy);
      const ry =
        y * (1 - 2 * qx * qx - 2 * qz * qz) + z * (2 * qy * qz + 2 * qw * qx);
      const rz =
        y * (2 * qy * qz + 2 * qw * qx) + z * (1 - 2 * qx * qx - 2 * qy * qy);

      // This gives us a rotated vector indicating the "forward" direction of the
      // phone with respect to the earth.  We only care about the orientation of
      // this vector in the XY plane (the plane tangential to the ground), i.e.
      // the heading of the (rx, ry) vector, where (0, 1) is north.

      const radians = Math.atan2(ry, rx);
      const degrees = (radians * 180) / Math.PI; // counterclockwise from +X axis
      let heading = 90 - degrees;
      if (heading < 0) heading += 360;
      heading = Math.round(heading);

      //   info.value =
      //     qx.toFixed(3) +
      //     "\n" +
      //     qy.toFixed(3) +
      //     "\n" +
      //     qz.toFixed(3) +
      //     "\n" +
      //     qw.toFixed(3) +
      //     "\n\n" +
      //     rx.toFixed(3) +
      //     "\n" +
      //     ry.toFixed(3) +
      //     "\n" +
      //     rz.toFixed(3) +
      //     "\n\nHeading: " +
      //     heading;

      // To make the arrow point north, rotate it opposite to the phone rotation.
      style.getImage().setRotation((Math.PI / 180) * heading);
    }

    // See the API specification at: https://w3c.github.io/orientation-sensor
    // We use referenceFrame: 'screen' because the web page will rotate when
    // the phone switches from portrait to landscape.
    const sensor = new AbsoluteOrientationSensor({
      frequency: 10,
      referenceFrame: "screen",
    });
    sensor.addEventListener("reading", () => {
      handleReading(sensor.quaternion);
    });

    handleReading([0.509, -0.071, -0.19, 0.836]);

    Promise.all([
      navigator.permissions.query({ name: "accelerometer" }),
      navigator.permissions.query({ name: "magnetometer" }),
      navigator.permissions.query({ name: "gyroscope" }),
    ]).then((results) => {
      if (results.every((result) => result.state === "granted")) {
        sensor.start();
        stat.value = "Sensor started!";
      } else {
        stat.value = "No permissions to use AbsoluteOrientationSensor.";
      }
    });
  }, [mapContent]);

  return (
    <div
      id="map-container"
      style={{ height: "800px", width: "800px" }}
      ref={mapRef}
    >
      <p>New Compass</p>
    </div>
  );
};

export default BasicCompass;
