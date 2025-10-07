import { useState } from "react";
import { GetServerSideProps } from "next";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Driver } from "@/schemas/driver";

interface Props {
  initialDrivers: Driver[];
  user: any;
}

export default function DriversPage({ initialDrivers }: Props) {
  return (
    <AdminLayout title="Gestão de Motoristas">
      <div>Lista de motoristas - Interface atualizada</div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import("@/lib/auth/adminCheck");
  const authResult = await checkAdminAuth(context);
  
  if ("redirect" in authResult) {
    return authResult;
  }

  return {
    props: {
      ...authResult.props,
      initialDrivers: [],
    },
  };
};