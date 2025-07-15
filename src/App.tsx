import "./App.css";
import {
  createBrowserRouter,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import { RouterProvider } from "react-router/dom";

//components
import StuddyBuddyLanding from "./components/LandingPage";
import Manual from "./components/uploadComponents/Manual";
import PickFromDb from "./components/uploadComponents/PickFromDb";
import Picture from "./components/uploadComponents/Picture";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Contact from "./components/Contact";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Test from "./components/Test";
import Timer from "./components/Timer";
import NotFound from "./components/NotFound";
import { TimerProvider } from "./components/TimerProvider";
import BasicLayout from "./components/BasicLayout";

//router
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route index element={<StuddyBuddyLanding />} />
      {/*Homepagina zonder Layout*/}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
          path="/timer"
          element={
            <ProtectedRoute>
              <Timer />
            </ProtectedRoute>
          }
      />
      {/*Routes met BasicLayout*/}
      <Route path="/" element={<BasicLayout />}>
        {/*all acces Routes*/}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
        {/*Protected Routes */}
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload/manual"
          element={
            <ProtectedRoute>
              <Manual />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload/pick-from-db"
          element={
            <ProtectedRoute>
              <PickFromDb />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload/picture"
          element={
            <ProtectedRoute>
              <Picture />
            </ProtectedRoute>
          }
        />

        <Route
          path="/toets"
          element={
            <ProtectedRoute>
              <Test />
            </ProtectedRoute>
          }
        />
      </Route>
    </>
  )
);

function App() {
  return (
    <TimerProvider>
      <RouterProvider router={router} />;
    </TimerProvider>
  );
}

export default App;
