import {gql} from '@apollo/client';
import Link from 'next/link';
import {FaCat, FaDog} from 'react-icons/fa';

import {withAuth} from '@/lib/withAuth';
import {getClient} from '@/graphql/ApolloClient';
import {MemberBookingForm} from '@/components/MemberBookingForm';
import {MemberRegisterForm} from '@/components/MemberRegisterForm';

const QUERY = gql`
  query BookingItemQuery($bookingCode: String!) {
    userBooking: userBooking(bookingCode: $bookingCode) {
      id
      startDate
      endDate
      maxGuests
      numGuests
      withCat
      withDog
      bookingCode
      status
      item {
        id
        image
        text
      }
      member {
        id
        status
        user {
          name
        }
      }
    }
  }
`;

async function BookingPage({params}) {
  try {
    const {data, error} = await getClient().query({
      query: QUERY,
      variables: {bookingCode: params.id},
    });
    const userBooking = data.userBooking;
    const numToRegister = Math.max(
      0,
      userBooking.numGuests - userBooking.member.length - 1,
    );
    const toRegister = Array(numToRegister)
      .fill(0)
      .map((_, i) => i);
    return (
      <div className="min-h-screen w-full bg-base-200">
        <div className="hero-content flex-col items-start lg:flex-row">
          <figure className="h-96 w-96">
            {userBooking?.item ? (
              <img src={userBooking.item.image} />
            ) : (
              <div className="placeholder h-96 w-96 bg-neutral-content" />
            )}
          </figure>
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-bold">
              Booking Code: {userBooking.bookingCode}
            </h2>
            <Link
              className="link"
              href={`/booking/${userBooking.bookingCode}/edit`}>
              update
            </Link>
            <div className="flex justify-between gap-2">
              <div>Status</div>
              <div className="badge badge-accent badge-lg">
                {userBooking.status}
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <div>Start Date</div>
              <div className="badge badge-ghost badge-lg">
                {new Date(userBooking.startDate).toLocaleDateString('en-CA')}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <div>End Date</div>
              <div className="badge badge-ghost badge-lg">
                {new Date(userBooking.endDate).toLocaleDateString('en-CA')}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <div>Number of Guests</div>
              <div className="badge badge-accent badge-lg">
                {userBooking.numGuests}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <div>Max Guests</div>
              <div className="badge badge-accent badge-lg">
                {userBooking.maxGuests}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <div>Animals</div>
              <div className="flex flex-row gap-2">
                {userBooking.withCat && <FaCat />}
                {userBooking.withDog && <FaDog />}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div>
                {toRegister.map((tid, index) => (
                  <MemberRegisterForm
                    key={`mra-${index}`}
                    booking={userBooking}
                  />
                ))}
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userBooking.member.map((mb, index) => (
                    <tr key={`mb-${index}`}>
                      <th>{index + 1}</th>
                      <td>{mb.user.name}</td>
                      <td>
                        <MemberBookingForm
                          memberBooking={mb}
                          booking={userBooking}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}

export default withAuth(BookingPage, '', '/');
