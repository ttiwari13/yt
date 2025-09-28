// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/authContext'; 
import Home from './components/Home';
import Course from './components/Course';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course/:type/:id" element={<Course />} />
      </Routes>
    </Router>
  );
}
export default App;