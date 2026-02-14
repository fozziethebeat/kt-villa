"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import Image from "next/image";

interface TestGenerateImageData {
    testGenerateImage: string;
}

interface TestGenerateImageVariables {
    prompt: string;
}

const TEST_GENERATE_IMAGE = gql`
  mutation TestGenerateImage($prompt: String!) {
    testGenerateImage(prompt: $prompt)
  }
`;

import { Header } from '@/components/Header';

const links = [{ url: '/', label: 'Home' }, { url: '/admin', label: 'Admin' }];

export default function ImageGenPage() {
    const [prompt, setPrompt] = useState("");
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const [generateImage, { loading, error }] = useMutation<TestGenerateImageData, TestGenerateImageVariables>(TEST_GENERATE_IMAGE, {
        onCompleted: (data) => {
            setGeneratedImage(data.testGenerateImage);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;
        setGeneratedImage(null);
        generateImage({ variables: { prompt } });
    };

    return (
        <div className="space-y-4">
            <Header links={links} target="Image Gen" />
            <div className="max-w-2xl mx-auto space-y-8 p-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Image Generation Tester</h1>
                    <p className="text-gray-500">
                        Enter a prompt below to test the active image generation model configuration.
                    </p>
                </div>

                <div className="p-6 bg-white rounded-lg border shadow-sm space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="prompt" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Prompt
                            </label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A futuristic city in the clouds..."
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !prompt}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-black text-white"
                        >
                            {loading ? "Generating..." : "Generate Image"}
                        </button>
                    </form>

                    {error && (
                        <div className="p-4 rounded-md bg-red-50 text-red-900 border border-red-200 text-sm">
                            Error: {error.message}
                        </div>
                    )}

                    {generatedImage && (
                        <div className="space-y-4">
                            <div className="text-sm font-medium">Result:</div>
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-gray-100">
                                <Image
                                    src={generatedImage}
                                    alt={prompt}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <div className="text-xs text-gray-500 break-all p-2 bg-gray-50 rounded">
                                URL: {generatedImage}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
