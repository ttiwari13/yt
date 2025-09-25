// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import Library from './components/Library';
import Home from './components/Home';
import Course from './components/Course';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* This route handles both videos and playlists */}
        <Route path="/course/:type/:id" element={<Course />} />
      </Routes>
    </Router>
  );
}
export default App;