import AppRoutes from "./routes/AppRoutes.jsx";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";

export default function App() {
  return (
    <div className="app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Header />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}
