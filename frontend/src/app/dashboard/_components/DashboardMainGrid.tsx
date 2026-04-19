"use client";

import { BuyInsuranceSection } from "@/components/dashboard/BuyInsuranceSection";
import { FlightRouteSection } from "@/components/dashboard/FlightRouteSection";
import { HowItWorksCard } from "@/components/dashboard/HowItWorksCard";
import { MyPoliciesSection } from "@/components/dashboard/MyPoliciesSection";
import { ProductDetailsPanel } from "@/components/dashboard/ProductDetailsPanel";
import type { DashboardMainGridProps } from "@/app/dashboard/_components/types";

export function DashboardMainGrid(props: DashboardMainGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <BuyInsuranceSection
          activeSection={props.activeSection}
          showBuyForm={props.showBuyForm}
          setShowBuyForm={props.setShowBuyForm}
          connected={props.connected}
          isSubmitting={props.isSubmitting}
          handleBuy={props.handleBuy}
          productId={props.productId}
          setProductId={props.setProductId}
          products={props.products}
          isLoadingProducts={props.isLoadingProducts}
          showProductById={props.showProductById}
          pnr={props.pnr}
          setPnr={props.setPnr}
          pnrStatus={props.pnrStatus}
          setPnrStatus={props.setPnrStatus}
          flightNumber={props.flightNumber}
          setFlightNumber={props.setFlightNumber}
          departureDate={props.departureDate}
          setDepartureDate={props.setDepartureDate}
          departureTime={props.departureTime}
          setDepartureTime={props.setDepartureTime}
          fetchedPassenger={props.fetchedPassenger}
          setFetchedPassenger={props.setFetchedPassenger}
          existingPolicyForPnr={props.existingPolicyForPnr}
          openPolicyModal={props.openPolicyModal}
          isUsdcOptedIn={props.isUsdcOptedIn}
          usdcBalance={props.usdcBalance}
          canShowFaucet={props.canShowFaucet}
          handleOptInUsdc={props.handleOptInUsdc}
          isOptingInUsdc={props.isOptingInUsdc}
          peraWallet={props.peraWallet}
        />
        <MyPoliciesSection
          activeSection={props.activeSection}
          connected={props.connected}
          policiesFetchError={props.policiesFetchError}
          fetchMyPolicies={props.fetchMyPolicies}
          isLoadingPolicies={props.isLoadingPolicies}
          myPolicies={props.myPolicies}
          showAllPolicies={props.showAllPolicies}
          setShowAllPolicies={props.setShowAllPolicies}
          setShowBuyForm={props.setShowBuyForm}
          peraExplorerBase={props.peraExplorerBase}
          address={props.address}
          openPolicyModal={props.openPolicyModal}
        />
      </div>
      <div className="space-y-6 lg:col-span-1">
        <ProductDetailsPanel selectedProductInfo={props.selectedProductInfo} />
        <FlightRouteSection
          pnr={props.pnr}
          pnrStatus={props.pnrStatus}
          pnrRoute={props.pnrRoute}
        />
        <HowItWorksCard />
      </div>
    </div>
  );
}
