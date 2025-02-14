
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  VideoConference,
  PreJoin,
  LocalUserChoices,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { motion } from "framer-motion";
import { Webinar } from "@/types/webinar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const webinar = mockWebinars.find(w => w.id === id);
  const [isJoining, setIsJoining] = useState(false);

  // Verificar que las variables de entorno estén disponibles
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      toast({
        variant: "destructive",
        title: "Error de configuración",
        description: "La configuración de Supabase no está completa. Por favor, conecta tu proyecto a Supabase."
      });
    }
  }, []);

  // Inicializar Supabase solo si las variables de entorno están disponibles
  const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )
    : null;

  const generateToken = async (participantName: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado correctamente');
      }

      const { data: secrets, error: secretsError } = await supabase
        .from('secrets')
        .select('name, value')
        .in('name', ['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET']);

      if (secretsError) {
        throw new Error('Error al obtener las credenciales de LiveKit');
      }

      if (!secrets || secrets.length < 2) {
        throw new Error('LiveKit configuration not found');
      }

      const apiKey = secrets.find(s => s.name === 'LIVEKIT_API_KEY')?.value;
      const apiSecret = secrets.find(s => s.name === 'LIVEKIT_API_SECRET')?.value;

      if (!apiKey || !apiSecret) {
        throw new Error('LiveKit credentials not found');
      }

      const response = await fetch('https://my-livekit-app.livekit.cloud/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          apiSecret,
          roomName: webinar?.roomName,
          participantName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const { token } = await response.json();
      return token;
    } catch (err) {
      console.error('Error generating token:', err);
      throw err;
    }
  };

  const handleJoinWebinar = async (values: LocalUserChoices) => {
    try {
      setIsJoining(true);
      const newToken = await generateToken(values.username);
      setToken(newToken);
      setUserName(values.username);
    } catch (err) {
      console.error('Error joining webinar:', err);
      setError('Error al unirse al webinar. Por favor, intente nuevamente.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo unir al webinar. Por favor, verifica la configuración de Supabase y LiveKit."
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (!webinar) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Webinar no encontrado</h2>
          <Button onClick={() => navigate('/')} className="w-full">
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {token ? (
        <LiveKitRoom
          token={token}
          serverUrl="wss://my-livekit-app.livekit.cloud"
          connect={true}
          video={true}
          audio={true}
        >
          <VideoConference />
        </LiveKitRoom>
      ) : (
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-2xl mx-auto p-8">
              <h1 className="text-3xl font-bold mb-4">{webinar.title}</h1>
              <p className="text-gray-600 mb-6">{webinar.description}</p>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Anfitrión: {webinar.hostName}
                </p>
                <p className="text-sm text-gray-500">
                  Fecha: {webinar.startTime.toLocaleDateString()}
                </p>
              </div>
              <PreJoin
                onError={(err) => setError(err.message)}
                onSubmit={handleJoinWebinar}
              />
              {error && (
                <p className="text-red-500 mt-4 text-center">{error}</p>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WebinarRoom;
