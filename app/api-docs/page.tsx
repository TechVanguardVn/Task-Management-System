import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { TaskflowMark } from '@/app/_components/brand-mark'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Swagger API Docs - Taskflow',
    description: 'Interactive OpenAPI / Swagger documentation for Taskflow REST API',
}

export default function ApiDocsPage() {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                    <TaskflowMark className="w-7 h-7" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">Taskflow</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                                OpenAPI 3.0
                            </span>
                        </div>
                        <p className="text-[11px] text-stone-400">Interactive API Documentation & Explorer</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/api/openapi.json"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-xs font-medium transition-colors"
                    >
                        <span>openapi.json</span>
                        <ExternalLink size={12} />
                    </a>
                    <Link
                        href="/boards"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-medium transition-colors shadow-2xs"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
            </header>

            {/* Swagger UI Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
                <div
                    id="swagger-ui"
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-8 overflow-hidden min-h-[600px]"
                />
            </main>

            {/* Swagger UI Styles & Scripts */}
            <link
                rel="stylesheet"
                href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
            />
            <Script
                src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
                strategy="afterInteractive"
            />
            <Script id="swagger-init" strategy="afterInteractive">
                {`
                    function initSwagger() {
                        if (window.SwaggerUIBundle) {
                            window.ui = window.SwaggerUIBundle({
                                url: '/api/openapi.json',
                                dom_id: '#swagger-ui',
                                deepLinking: true,
                                presets: [
                                    window.SwaggerUIBundle.presets.apis,
                                    window.SwaggerUIBundle.SwaggerUIStandalonePreset
                                ],
                                layout: 'BaseLayout',
                                displayRequestDuration: true,
                                filter: true,
                                docExpansion: 'list',
                                defaultModelsExpandDepth: 1,
                            });
                        } else {
                            setTimeout(initSwagger, 50);
                        }
                    }
                    if (document.readyState === 'complete' || document.readyState === 'interactive') {
                        initSwagger();
                    } else {
                        window.addEventListener('DOMContentLoaded', initSwagger);
                    }
                `}
            </Script>
        </div>
    )
}
