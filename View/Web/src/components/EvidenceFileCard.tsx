import React, { useState } from 'react';
import './EvidenceFileCard.css';

interface Props {
    fileName: string;
    fileUrl: string;
    fileSize?: string | number;
}

export const EvidenceFileCard: React.FC<Props> = ({ fileName, fileUrl, fileSize }) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Determine file type
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
    const isPDF = fileExtension === 'pdf';

    const formatFileSize = (size: string | number): string => {
        if (typeof size === 'string') return size;
        if (size === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(size) / Math.log(k));
        return Math.round((size / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const handleDownload = () => {
        // Log the URL for debugging
        console.log('[EvidenceFileCard] Opening URL:', fileUrl);

        // Open in new tab
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        console.log('[EvidenceFileCard] Image loaded successfully:', fileName);
    };

    const handleImageError = (_e: any) => {
        console.error('[EvidenceFileCard] Image load failed:', fileName, fileUrl);
        setImageError(true);
        setIsLoading(false);
    };

    // Validate URL
    const isValidUrl = fileUrl && fileUrl.startsWith('http');

    if (!isValidUrl) {
        console.error('[EvidenceFileCard] Invalid URL:', fileUrl);
    }

    return (
        <div className="evidence-card">
            <div className="file-preview">
                {isImage && !imageError && isValidUrl ? (
                    <>
                        {isLoading && (
                            <div className="preview-placeholder">
                                <span>Loading image...</span>
                            </div>
                        )}
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className={isLoading ? 'hidden' : ''}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            crossOrigin="anonymous"
                        />
                    </>
                ) : isPDF ? (
                    <div className="preview-placeholder">
                        <span className="file-icon">📄</span>
                        <span>PDF Document</span>
                    </div>
                ) : (
                    <div className="preview-placeholder">
                        <span className="file-icon">📎</span>
                        <span>File Attachment</span>
                    </div>
                )}
            </div>

            <div className="file-info">
                <p className="file-name" title={fileName}>
                    {fileName}
                </p>
                {fileSize && (
                    <p className="file-size">{formatFileSize(fileSize)}</p>
                )}
                {!isValidUrl && (
                    <p className="error-text">Invalid file URL</p>
                )}
                <button
                    className="download-button"
                    onClick={handleDownload}
                    disabled={!isValidUrl}
                >
                    {isPDF ? 'View PDF' : isImage ? 'View Full Size' : 'Download'}
                </button>

                {/* Debug info - remove in production */}
                <small style={{ fontSize: '10px', color: '#999', marginTop: '8px', display: 'block', wordBreak: 'break-all' }}>
                    URL: {fileUrl}
                </small>
            </div>
        </div>
    );
};
