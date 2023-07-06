import React from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { shopify } from "../shopify.server";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { getQRCodes } from "../models/QRCode";
import { ImageMajor } from "@shopify/polaris-icons";

export async function loader({ request }) {
  const { admin } = await shopify.authenticate.admin(request);
  const QRCodes = await getQRCodes(admin.shop);

  return json({
    QRCodes,
  });
}

export default function Index() {
  const { QRCodes } = useLoaderData();
  const navigate = useNavigate();

  function truncate(str, n) {
    return str.length > n ? str.substr(0, n - 1) + "…" : str;
  }

  const emptyMarkup = QRCodes.length ? null : (
    <EmptyState
      heading="Create unique QR codes for your product"
      /* This button will take the user to a Create a QR code page */
      action={{
        content: "Create QR code",
        url: "/app/qrcodes/new",
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Allow customers to scan codes and buy products using their phones.</p>
    </EmptyState>
  );

  const qrCodesMarkup = QRCodes.length ? (
    <IndexTable
      resourceName={{
        singular: "QR code",
        plural: "QR codes",
      }}
      itemCount={QRCodes.length}
      headings={[
        { title: "Thumbnail", hidden: true },
        { title: "Title" },
        { title: "Product" },
        { title: "Discount" },
        { title: "Scans" },
      ]}
      selectable={false}
    >
      {QRCodes.map(
        ({ id, title, productImage, productHandle, discountCode, scans }) => {
          return (
            <IndexTable.Row id={id} key={id} position={id}>
              <IndexTable.Cell>
                <Thumbnail
                  source={productImage || ImageMajor}
                  alt={"product image or placeholder"}
                  color="base"
                  size="small"
                />
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Link data-primary-link to={`/app/qrcodes/${id}`}>
                  {truncate(title, 25)}
                </Link>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text>{truncate(productHandle, 25)}</Text>
              </IndexTable.Cell>
              <IndexTable.Cell>{discountCode}</IndexTable.Cell>
              <IndexTable.Cell>{scans}</IndexTable.Cell>
            </IndexTable.Row>
          );
        }
      )}
    </IndexTable>
  ) : null;

  return (
    <Page>
      <TitleBar
        title="QR codes"
        primaryAction={{
          content: "Create QR code",
          url: "/app/qrcodes/new",
        }}
      />
      <Layout>
        <Layout.Section>
          <Card padding={"0"}>
            {emptyMarkup}
            {qrCodesMarkup}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
