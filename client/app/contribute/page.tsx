"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Contribution = {
    banglish_text: string;
    bangla_text: string;
    isApproved: boolean;
};

export default function Contribute() {
    const [loading, setLoading] = useState(false);
    const [banglish, setBanglish] = useState("");
    const [bangla, setBangla] = useState("");
    const [contributions, setContributions] = useState<Contribution[] | null>();

    useEffect(() => {
        const fetchContributions = async () => {
            try {
                const response = await fetch("/api/contribution");
                const data = await response.json();
                console.log(data)
                setContributions(data);
            } catch (err) {
                toast.error("Something went wrong. Please try again later.");
                console.error(err);
            }
        };
        fetchContributions();
    }, []);

    const onSubmit = async () => {
        try {
            if (!banglish || !bangla) return;
            setLoading(true);
            const response = await fetch("/api/contribution", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    banglish_text: banglish,
                    bangla_text: bangla
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Successfully submitted!");
                setBanglish("");
                setBangla("");
            } else {
                toast.error("Something went wrong. Please try again later.");
            }
        } catch (err) {
            toast.error("Something went wrong. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
  return (
    <div className="py-12 px-4 mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">Crowd-Powered Translation Refinement</h1>
        <p className="pt-4 max-w-6xl">
        Contribute to enhancing our Banglish-to-Bangla conversion by submitting Banglish text and its corresponding Bangla translations. Every contribution helps the app become smarter and more accurate!
        </p>

        <div className="p-4 rounded shadow bg-gray-50 mt-8">
            <label className="font-semibold" htmlFor="banglish">Banglish Text</label>
            <textarea id="banglish" className="p-4 shadow bg-white rounded border min-h-20 w-full mb-4" placeholder="Ekhane banglish likhun..." value={banglish} onChange={(e) => setBanglish(e.target.value)}></textarea>

            <label className="font-semibold" htmlFor="bangla">Bangla Text</label>
            <textarea id="bangla" className="p-4 shadow bg-white rounded border min-h-20 w-full mb-4" placeholder="এখানে বাংলা লিখুন..." value={bangla} onChange={(e) => setBangla(e.target.value)}></textarea>

            <button onClick={onSubmit} className="bg-primary px-4 py-2 rounded text-white" disabled={loading}>{loading ? "Please wait..." : "Submit"}</button>
        </div>

        <div className="p-4 rounded shadow bg-gray-50 mt-8">
            <h1 className="text-2xl font-bold">My contributions</h1>
            <div className="pt-4">
                {
                    contributions ? (
                        <table className="w-full p-2 rounded bg-white">
                            <thead>
                                <tr>
                                    <th className="p-2 border">No.</th>
                                    <th className="p-2 border">Banglish</th>
                                    <th className="p-2 border">Bangla</th>
                                    <th className="p-2 border text-center">Approved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    contributions.map((contribution, index) => (
                                        <tr key={index}>
                                            <td className="p-2 border text-center">{ index + 1}</td>
                                            <td className="p-2 border">{ contribution.banglish_text}</td>
                                            <td className="p-2 border">{ contribution.bangla_text}</td>
                                            <td className="p-2 border text-center">{ contribution.isApproved ? "Approved" : "Not Approved" }</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    ) : (
                        <p>No contributions found.</p>
                    )
                }
            </div>
        </div>
    </div>
  )
}