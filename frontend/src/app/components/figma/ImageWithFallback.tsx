import React, { useState, useEffect } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | undefined>(props.src)

  useEffect(() => {
    if (!props.src) {
      setImgSrc(undefined);
      return;
    }
    
    let isMounted = true;
    let objectUrl: string | null = null;
    
    if (props.src.includes('ngrok-free.dev')) {
      fetch(props.src, {
        headers: {
          'ngrok-skip-browser-warning': '69420'
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch image');
          return response.blob();
        })
        .then(blob => {
          if (isMounted) {
            objectUrl = URL.createObjectURL(blob);
            setImgSrc(objectUrl);
            setDidError(false);
          }
        })
        .catch(err => {
          if (isMounted) setDidError(true);
        });
    } else {
      setImgSrc(props.src);
      setDidError(false);
    }

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [props.src]);

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={imgSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
