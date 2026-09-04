// this is for the image at the top shown in the details of each property
import Image from 'next/image';

const PropertyHeaderImage = ({image}) => {
    return (
        <section>
            <div className="container-xl m-auto">
                <div className="grid grid-cols-1">
                    {/* a flat 400px swallows a phone screen, so the banner
                        scales with the viewport instead */}
                    <Image
                        src={image}
                        alt=""
                        className="object-cover h-[260px] sm:h-[340px] lg:h-[440px] w-full"
                        width={0}
                        height={0}
                        sizes='100vw'
                        priority={true}
                    />
                </div>
            </div>
        </section>
    )
}

export default PropertyHeaderImage;