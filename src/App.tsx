import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import Duplicates from "@/pages/Duplicates";
import Recycle from "@/pages/Recycle";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="duplicates" element={<Duplicates />} />
          <Route path="recycle" element={<Recycle />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
