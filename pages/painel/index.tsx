import { GetServerSideProps } from 'next';

// Esta página redireciona /painel para /dashboard
export default function PainelRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: true,
    },
  };
};