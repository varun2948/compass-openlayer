import CarouselContainer from "varun-ui-library";
import "varun-ui-library/dist/style.css";
const slides = [
  { key: 1, content: "Slide 1" },
  { key: 2, content: "Slide 2" },
  { key: 3, content: "Slide 3" },
  { key: 4, content: "Slide 4" },
  { key: 5, content: "Slide 5" },
  { key: 6, content: "Slide 6" },
  // Add more slides here
];
const App = () => {
  return <CarouselContainer slides={slides} />;
};

export default App;
