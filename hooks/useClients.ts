"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Fetch all clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setClients(data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar clientes");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Create new client
  const createNewClient = async (clientData: ClientInsert) => {
    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setClients((prev) => [data, ...prev]);
      }

      return { data, error: null };
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear cliente";
      setError(errorMessage);
      console.error("Error creating client:", err);
      return { data: null, error: errorMessage };
    }
  };

  // Update client
  const updateClient = async (id: string, clientData: Partial<ClientInsert>) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setClients((prev) =>
          prev.map((client) => (client.id === id ? data : client))
        );
      }

      return { data, error: null };
    } catch (err: any) {
      const errorMessage = err.message || "Error al actualizar cliente";
      setError(errorMessage);
      console.error("Error updating client:", err);
      return { data: null, error: errorMessage };
    }
  };

  // Delete client
  const deleteClient = async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setClients((prev) => prev.filter((client) => client.id !== id));

      return { error: null };
    } catch (err: any) {
      const errorMessage = err.message || "Error al eliminar cliente";
      setError(errorMessage);
      console.error("Error deleting client:", err);
      return { error: errorMessage };
    }
  };

  // Upload file to storage
  const uploadFile = async (
    clientId: string,
    file: File,
    fileName?: string
  ): Promise<{ data: { path: string; fullPath: string } | null; error: string | null }> => {
    try {
      setError(null);

      const fileExt = file.name.split(".").pop();
      const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${clientId}/${uniqueFileName}`;

      console.log("Uploading file:", { clientId, filePath, fileName: file.name, size: file.size });

      const { data, error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded successfully to storage:", data);

      // Get signed URL (bucket is private, so we need signed URLs)
      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error("Signed URL error:", signedUrlError);
        throw signedUrlError;
      }

      console.log("Signed URL created:", signedUrlData?.signedUrl);

      return {
        data: {
          path: filePath,
          fullPath: signedUrlData?.signedUrl || filePath,
        },
        error: null,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Error al subir archivo";
      setError(errorMessage);
      console.error("Error uploading file:", err);
      return { data: null, error: errorMessage };
    }
  };

  // Get signed URL for a file (for private bucket)
  const getSignedUrl = async (
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{ data: string | null; error: string | null }> => {
    try {
      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(filePath, expiresIn);

      if (signedUrlError) throw signedUrlError;

      return {
        data: signedUrlData?.signedUrl || null,
        error: null,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Error al obtener URL del archivo";
      console.error("Error getting signed URL:", err);
      return { data: null, error: errorMessage };
    }
  };

  // Delete file from storage
  const deleteFile = async (filePath: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase.storage
        .from("client-documents")
        .remove([filePath]);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err: any) {
      const errorMessage = err.message || "Error al eliminar archivo";
      setError(errorMessage);
      console.error("Error deleting file:", err);
      return { error: errorMessage };
    }
  };

  // Get a single client by ID
  const getClient = async (id: string) => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar cliente";
      setError(errorMessage);
      console.error("Error fetching client:", err);
      return { data: null, error: errorMessage };
    }
  };

  // Load clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient: createNewClient,
    updateClient,
    deleteClient,
    uploadFile,
    deleteFile,
    getSignedUrl,
    getClient,
  };
}

