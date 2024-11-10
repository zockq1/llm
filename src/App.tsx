// App.tsx
import React from "react";
import Chat from "./component/Chat";

const App: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f4f4f9",
      }}
    >
      <Chat />
    </div>
  );
};

export default App;
