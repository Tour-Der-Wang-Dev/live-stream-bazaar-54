
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

const fetchWebinar = async (id: string): Promise<Webinar | null> => {
  console.log('Fetching webinar with ID:', id); // Agregamos log para debug
  
  if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('ID inválido:', id);
    return null;
  }

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener webinar:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    startTime: new Date(data.start_time),
    hostName: data.host_name,
    roomName: data.room_name
  };
};

const WebinarRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [liveKitUrl] = useState("wss://juliawebinars-brslrae2.livekit.cloud");

  const { data: webinar, isLoading } = useQuery({
    queryKey: ['webinar', id],
    queryFn: () => fetchWebinar(id || ''),
    enabled: !!id
  });

  const generateToken = async (participantName: string) => {
    try {
      console.log('Generando token para:', participantName);
      const { data: secrets, error: secretsError } = await supabase
        .from('secrets')
        .select('name, value')
        .in('name', ['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET']);

      if (secretsError) {
        console.error('Error al obtener secretos:', secretsError);
        throw new Error('Error al obtener las credenciales de LiveKit');
      }

      if (!secrets || secrets.length < 2) {
        console.error('Secretos no encontrados:', secrets);
        throw new Error('No se encontró la configuración de LiveKit');
      }

      const apiKey = secrets.find(s => s.name === 'LIVEKIT_API_KEY')?.value;
      const apiSecret = secrets.find(s => s.name === 'LIVEKIT_API_SECRET')?.value;

      if (!apiKey || !apiSecret) {
        console.error('Credenciales no encontradas:', { apiKey, apiSecret });
        throw new Error('No se encontraron las credenciales de LiveKit');
      }

      console.log('Haciendo petición al servidor con:', {
        roomName: webinar?.roomName,
        participantName
      });

      const response = await fetch('https://juliawebinars-brslrae2.livekit.cloud/token', {
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
        const errorData = await response.text();
        console.error('Error en la respuesta del servidor:', errorData);
        throw new Error('Error al generar el token');
      }

      const { token } = await response.json();
      console.log('Token generado exitosamente');
      return token;
    } catch (err) {
      console.error('Error al generar el token:', err);
      throw err;
    }
  };

  const handleJoinWebinar = async (values: LocalUserChoices) => {
    try {
      setIsJoining(true);
      console.log('Iniciando proceso de unión al webinar para:', values.username);
      const newToken = await generateToken(values.username);
      console.log('Token obtenido, configurando estado');
      setToken(newToken);
      setUserName(values.username);
    } catch (err) {
      console.error('Error al unirse al webinar:', err);
      setError('Error al unirse al webinar. Por favor, intente nuevamente.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo unir al webinar. Por favor, verifique la configuración."
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cargando...</h2>
        </Card>
      </div>
    );
  }

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
          serverUrl={liveKitUrl}
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
              <p className="text-gray-600 dark:text-gray-300 mb-6">{webinar.description}</p>
              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Anfitrión: {webinar.hostName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
              {isJoining && (
                <p className="text-blue-500 mt-4 text-center">
                  Conectando al webinar...
                </p>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WebinarRoom;
