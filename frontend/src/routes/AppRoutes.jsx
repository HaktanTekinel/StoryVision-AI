import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home.jsx";
import CreateStory from "../pages/CreateStory.jsx";
import Stories from "../pages/Stories.jsx";
import StoryDetail from "../pages/StoryDetail.jsx";
import NotFound from "../pages/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateStory />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/stories/:storyId" element={<StoryDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
