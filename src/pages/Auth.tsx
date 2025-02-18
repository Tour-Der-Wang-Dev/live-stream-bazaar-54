
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [proToken, setProToken] = useState(""); // Token para usuarios Pro

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Primero verificamos si el usuario es Pro
        const { data: proUser, error: proError } = await supabase
          .from('pro_users')
          .select('*')
          .eq('email', email)
          .single();

        if (proError || !proUser) {
          toast({
            variant: "destructive",
            title: "Acceso denegado",
            description: "Solo usuarios Pro pueden acceder a esta aplicación.",
          });
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        navigate("/");
      } else {
        // Para el registro, verificamos el token Pro
        const { data: proToken, error: tokenError } = await supabase
          .from('pro_tokens')
          .select('*')
          .eq('token', proToken)
          .single();

        if (tokenError || !proToken) {
          toast({
            variant: "destructive",
            title: "Token inválido",
            description: "Se requiere un token Pro válido para registrarse.",
          });
          return;
        }

        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              is_teacher: isTeacher,
              is_pro: true,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Crear entrada en pro_users
        const { error: proError } = await supabase
          .from('pro_users')
          .insert([
            {
              email,
              user_id: data.user?.id,
            }
          ]);

        if (proError) throw proError;

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            is_teacher: isTeacher,
            is_pro: true,
          })
          .eq('id', data.user?.id);

        if (updateError) throw updateError;

        toast({
          title: "¡Registro exitoso!",
          description: "Ya puedes iniciar sesión con tu cuenta Pro.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            {isLogin ? "Iniciar Sesión" : "Registro"} Pro
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <>
                <div>
                  <Input
                    placeholder="Nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Token Pro"
                    value={proToken}
                    onChange={(e) => setProToken(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isTeacher"
                    checked={isTeacher}
                    onChange={(e) => setIsTeacher(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isTeacher">Soy profesor</label>
                </div>
              </>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? "Cargando..."
                : isLogin
                ? "Iniciar Sesión"
                : "Registrarse"}
            </Button>
          </form>
          <p className="text-center mt-4">
            {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:underline"
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>

          <Alert variant="info" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta aplicación es exclusiva para usuarios Pro.
            </AlertDescription>
          </Alert>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
