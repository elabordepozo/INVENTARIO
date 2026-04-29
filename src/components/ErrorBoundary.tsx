import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 min-h-screen text-red-900 font-mono">
          <h1 className="text-2xl font-bold mb-4">Error en la aplicación 🤕</h1>
          <p className="mb-4">Se ha producido un error inesperado. Por favor comparte este texto para poder arreglarlo:</p>
          <pre className="bg-red-100 p-4 rounded overflow-auto text-sm">
            {this.state.error && this.state.error.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => {
              localStorage.removeItem("inventory_products");
              localStorage.removeItem("inventory_sales");
              window.location.reload();
            }}
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700"
          >
            Resetear Datos y Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
