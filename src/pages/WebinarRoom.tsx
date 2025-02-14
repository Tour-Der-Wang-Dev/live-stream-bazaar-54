
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LiveKitRoom,
  VideoConference,
  PreJoin,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Webinar } from "@/types/webinar";

// En una versión real, esto vendría de una API
const mockWebinars: Webinar[] = [
  {
    id: "1",
    title: "Introducción a React",
    description: "Aprende los fundamentos de React desde cero",
    startTime: new Date(Date.now() + 86400000),
    hostName: "Ana García",
    roomName: "react-intro"
  },
  {
    id: "2",
    title: "TypeScript Avanzado",
    description: "Mejora tus habilidades en TypeScript",
    startTime: new Date(Date.now() + 172800000),
    hostName: "Carlos Pérez",
    roomName: "ts-advanced"
  }
];

const WebinarRoom = () => {
  const { id } = useParams();
  const [token, setToken] = useState("");
  const webinar = mockWebinars.find(w => w.id === id);

  // En una versión real, esto vendría de tu backend
  const serverUrl = "wss://your-livekit-server";
  
  useEffect(() => {
    // Aquí obtendrías el token de tu backend
    setToken("your-livekit-token");
  }, []);

  if (!webinar) {
    return <div>Webinar no encontrado</div>;
  }

  return (
    <div className="h-screen">
      {token ? (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          video={true}
          audio={true}
        >
          <VideoConference />
        </LiveKitRoom>
      ) : (
        <PreJoin />
      )}
    </div>
  );
};

export default WebinarRoom;
