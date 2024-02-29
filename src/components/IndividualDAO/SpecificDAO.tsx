"use client";

import React, { useEffect, useState } from "react";
import DelegatesList from "./DelegatesList";
import DelegatesSession from "./DelegatesSession";
import OfficeHours from "./OfficeHours";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const desc = {
  optimism:
    "Optimism DAO is the heart of the Optimism network, an innovative layer 2 solution for faster, cheaper transactions on Ethereum. Think of it as a community-driven engine, where token holders govern upgrades, fees, and the overall direction of the Optimism ecosystem. With a focus on scaling Ethereum effectively and sustainably, Optimism DAO is building a brighter future for blockchain technology.",

  arbitrum:
    "The Arbitrum DAO is a decentralized autonomous organization (DAO) built on the Ethereum blockchain. At its core, the Arbitrum DAO is a community-driven governance mechanism that allows $ARB token holders to propose and vote on changes to the organization and the technologies it governs.",
};

function SpecificDAO({ props }: { props: { daoDelegates: string } }) {
  const router = useRouter();
  const path = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="font-poppins py-6">
      <div className="px-8 pb-5">
        <div className="flex justify-between pe-10">
          <div className="capitalize text-4xl text-blue-shade-100">
            {props.daoDelegates}
          </div>
          <div>
            <ConnectButton />
          </div>
        </div>

        <div className="py-5 pr-8">
          {props.daoDelegates === "optimism" ? desc.optimism : desc.arbitrum}
        </div>
      </div>

      <div className="flex gap-12 bg-[#D9D9D945] pl-16">
        <button
          className={`border-b-2 py-4 px-2 ${
            searchParams.get("active") === "delegatesList"
              ? " border-blue-shade-200 text-blue-shade-200 font-semibold"
              : "border-transparent"
          }`}
          onClick={() => router.push(path + "?active=delegatesList")}
        >
          Delegates List
        </button>
        <button
          className={`border-b-2 py-4 px-2 ${
            searchParams.get("active") === "delegatesSession"
              ? "text-blue-shade-200 font-semibold border-blue-shade-200"
              : "border-transparent"
          }`}
          onClick={() =>
            router.push(path + "?active=delegatesSession&session=upcoming")
          }
        >
          Delegates Sessions
        </button>
        <button
          className={`border-b-2 py-4 px-2 ${
            searchParams.get("active") === "officeHours"
              ? "text-blue-shade-200 font-semibold border-b-2 border-blue-shade-200"
              : "border-transparent"
          }`}
          onClick={() =>
            router.push(path + "?active=officeHours&hours=ongoing")
          }
        >
          Office hours
        </button>
      </div>

      <div className="py-6 ps-16">
        {searchParams.get("active") === "delegatesList" ? (
          <DelegatesList props={props.daoDelegates} />
        ) : (
          ""
        )}
        {searchParams.get("active") === "delegatesSession" ? (
          <DelegatesSession props={props.daoDelegates} />
        ) : (
          ""
        )}
        {searchParams.get("active") === "officeHours" ? (
          <OfficeHours props={props.daoDelegates} />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default SpecificDAO;
