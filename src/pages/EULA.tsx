import React from "react";
import logo from "../assets/logo.png";

export default function EULA() {
  return (
    <div className="max-w-2xl mx-auto py-18 px-6">
      <div className="z-10 mb-2 flex flex-col items-center">
        <img
          src={logo}
          alt="Pandaura AS Logo"
          className="h-24 w-auto filter-none"
          style={{ filter: "none", imageRendering: "crisp-edges" }}
        />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-primary">
        End User License Agreement (EULA)
      </h1>
      <div className="space-y-6 text-base text-gray-800">
        <p>
          This End User License Agreement ("Agreement") is a legal agreement
          between you ("User") and Pandaura AS ("Company") for the use of the
          Pandaura AS software and services ("Software").
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">1. License Grant</h2>
        <p>
          The Company grants you a non-exclusive, non-transferable, limited
          license to use the Software in accordance with the terms of this
          Agreement.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">2. Restrictions</h2>
        <ul className="list-disc ml-6">
          <li>
            You may not copy, modify, distribute, sell, or lease any part of the
            Software.
          </li>
          <li>
            You may not reverse engineer or attempt to extract the source code
            of the Software.
          </li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-2">3. Termination</h2>
        <p>
          The Company may terminate your license if you fail to comply with any
          term of this Agreement. Upon termination, you must cease all use of
          the Software.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">
          4. Limitation of Liability
        </h2>
        <p>
          The Software is provided "as is" without warranty of any kind. The
          Company shall not be liable for any damages arising from the use or
          inability to use the Software.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">5. Governing Law</h2>
        <p>
          This Agreement shall be governed by the laws of Norway, without regard
          to its conflict of law principles.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">6. Contact</h2>
        <p>
          For any questions regarding this Agreement, please contact Pandaura AS
          at support@pandaura.com.
        </p>
      </div>
    </div>
  );
}
