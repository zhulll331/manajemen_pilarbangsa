import React from 'react';
import { Metadata } from 'next';
import QrGeneratorPage, { metadata as qrMetadata } from '../qr/page';

export const metadata: Metadata = {
  ...qrMetadata,
  alternates: {
    canonical: 'https://www.pilarbangsa.my.id/qr',
  },
};

export default function QrGeneratorAliasPage() {
  return <QrGeneratorPage />;
}
